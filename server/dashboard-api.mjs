import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT ?? 3000);
const adminUsername = process.env.DASHBOARD_ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.DASHBOARD_ADMIN_PASSWORD ?? "P@ssw0rd";
const authSecret = process.env.DASHBOARD_AUTH_SECRET ?? crypto.randomBytes(32).toString("hex");
const storageRoot = path.resolve(process.env.STORAGE_ROOT ?? "/storage");
const storageStatPath = path.resolve(process.env.STORAGE_STAT_PATH ?? storageRoot);
const loginAttempts = new Map();
const maxFailedLogins = Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS ?? 5);
const loginBlockMs = Number(process.env.LOGIN_BLOCK_MINUTES ?? 15) * 60 * 1000;
const maxTrackedLoginIps = Number(process.env.LOGIN_MAX_TRACKED_IPS ?? 10000);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

app.use(express.json());
app.set("trust proxy", 1);

const mimeTypes = new Map([
  [".apng", "image/apng"],
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".css", "text/css"],
  [".csv", "text/csv"],
  [".gif", "image/gif"],
  [".html", "text/html"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".log", "text/plain"],
  [".md", "text/markdown"],
  [".mov", "video/quicktime"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
  [".xml", "application/xml"],
  [".zip", "application/zip"],
]);

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", authSecret).update(value).digest("base64url");
}

function createToken(session) {
  const payload = base64url({
    ...session,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  });
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (signature !== sign(payload)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.session = session;
  next();
}

function sessionFromRequest(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return verifyToken(token);
}

function getClientIp(req) {
  return (req.ip || req.socket.remoteAddress || "unknown").trim();
}

function getLoginAttempt(ip) {
  const existing = loginAttempts.get(ip);
  if (!existing) return { count: 0, blockedUntil: 0 };
  if (existing.blockedUntil && existing.blockedUntil <= Date.now()) {
    loginAttempts.delete(ip);
    return { count: 0, blockedUntil: 0 };
  }
  if (!existing.blockedUntil && existing.lastFailedAt && Date.now() - existing.lastFailedAt > loginBlockMs) {
    loginAttempts.delete(ip);
    return { count: 0, blockedUntil: 0 };
  }
  return existing;
}

function pruneLoginAttempts() {
  const now = Date.now();
  for (const [ip, attempt] of loginAttempts) {
    if ((attempt.blockedUntil && attempt.blockedUntil <= now) || (!attempt.blockedUntil && attempt.lastFailedAt && now - attempt.lastFailedAt > loginBlockMs)) {
      loginAttempts.delete(ip);
    }
  }

  while (loginAttempts.size > maxTrackedLoginIps) {
    const oldestIp = loginAttempts.keys().next().value;
    if (!oldestIp) break;
    loginAttempts.delete(oldestIp);
  }
}

function recordFailedLogin(ip) {
  pruneLoginAttempts();
  const attempt = getLoginAttempt(ip);
  const nextCount = attempt.count + 1;
  const blockedUntil = nextCount >= maxFailedLogins ? Date.now() + loginBlockMs : attempt.blockedUntil;
  loginAttempts.set(ip, { count: nextCount, blockedUntil, lastFailedAt: Date.now() });
  return { count: nextCount, blockedUntil };
}

function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

async function ensureDashboardTables() {
  await query(`
    create table if not exists public."DashboardApiHit" (
      id bigserial primary key,
      method text not null,
      path text not null,
      status_code integer not null,
      success boolean not null,
      duration_ms integer not null,
      actor text,
      ip text,
      user_agent text,
      created_at timestamp without time zone not null default now()
    )
  `);
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getMimeType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

function getFileKind(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("xml")) return "text";
  return "file";
}

function resolveStoragePath(relativePath = "") {
  const resolved = path.resolve(storageRoot, relativePath);
  if (resolved !== storageRoot && !resolved.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Invalid storage path");
  }
  return resolved;
}

async function walkFiles(directory, base = "", limit = 250, results = []) {
  if (results.length >= limit) return results;

  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (results.length >= limit) break;
    if (entry.name.startsWith(".git") || entry.name === "node_modules") continue;

    const absolute = path.join(directory, entry.name);
    const relative = path.join(base, entry.name);
    const stats = await fs.stat(absolute);

    if (entry.isDirectory()) {
      await walkFiles(absolute, relative, limit, results);
      continue;
    }

    const mimeType = getMimeType(absolute);
    results.push({
      id: Buffer.from(relative).toString("base64url"),
      name: entry.name,
      path: relative.replaceAll(path.sep, "/"),
      type: path.extname(entry.name).replace(".", "").toUpperCase() || "FILE",
      mimeType,
      kind: getFileKind(mimeType),
      size: formatBytes(stats.size),
      sizeBytes: stats.size,
      owner: base.split(path.sep)[0] || "Server",
      updatedAt: stats.mtime.toISOString(),
    });
  }

  return results;
}

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api/")) return;
    const session = sessionFromRequest(req);
    void query(
      `
        insert into public."DashboardApiHit" (method, path, status_code, success, duration_ms, actor, ip, user_agent)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        req.method,
        req.originalUrl.slice(0, 500),
        res.statusCode,
        res.statusCode < 400,
        Date.now() - startedAt,
        session?.username ?? (req.path === "/api/auth/login" ? "admin" : null),
        req.ip,
        req.headers["user-agent"]?.slice(0, 500) ?? null,
      ],
    ).catch((error) => console.error("Failed to record API hit", error));
  });
  next();
});

function initials(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toUser(row) {
  return {
    id: row.id,
    avatar: initials(row.name || row.email),
    name: row.name || row.email || "Unnamed User",
    email: row.email || "-",
    provider: row.googleId ? "Google" : "Email",
    role: "User",
    premium: false,
    createdAt: row.createdAt,
    status: "Active",
    plan: "Free",
    lastLogin: row.updatedAt,
    device: "Web Browser",
  };
}

function toChat(row) {
  return {
    id: row.id,
    user: row.userName || row.userEmail || "Unknown User",
    prompt: row.prompt || row.title || "Conversation started",
    response: row.response || "No assistant response yet",
    model: "NeuraX AI",
    time: row.updatedAt,
    status: "Success",
  };
}

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    await query("select 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const ip = getClientIp(req);
  const attempt = getLoginAttempt(ip);
  if (attempt.blockedUntil > Date.now()) {
    const retryAfterSeconds = Math.ceil((attempt.blockedUntil - Date.now()) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      error: "Too many failed login attempts",
      retryAfterSeconds,
      blockedUntil: new Date(attempt.blockedUntil).toISOString(),
    });
    return;
  }

  const { username, password } = req.body ?? {};
  if (username !== adminUsername || password !== adminPassword) {
    const failed = recordFailedLogin(ip);
    const attemptsRemaining = Math.max(maxFailedLogins - failed.count, 0);
    if (failed.blockedUntil > Date.now()) {
      res.setHeader("Retry-After", String(Math.ceil((failed.blockedUntil - Date.now()) / 1000)));
      res.status(429).json({
        error: "Too many failed login attempts",
        attemptsRemaining,
        blockedUntil: new Date(failed.blockedUntil).toISOString(),
      });
      return;
    }

    res.status(401).json({ error: "Invalid credentials", attemptsRemaining });
    return;
  }

  clearFailedLogins(ip);

  const session = {
    username: adminUsername,
    name: "NeuraX Superuser",
    role: "Superuser",
    issuedAt: new Date().toISOString(),
  };

  res.json({ session, token: createToken(session) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ session: req.session });
});

app.get("/api/dashboard/summary", requireAuth, async (_req, res) => {
  try {
    const result = await query(`
      select
        (select count(*)::int from public."User") as "totalUsers",
        (select count(*)::int from public."Conversation") as "totalChats",
        (select count(*)::int from public."Message") as "totalMessages",
        (select count(*)::int from public."Message" where lower(role) = 'user') as "totalPrompts",
        (select count(*)::int from public."Message" where lower(role) = 'assistant') as "totalResponses"
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/users", requireAuth, async (_req, res) => {
  try {
    const result = await query(`
      select id, "googleId", email, name, "photoUrl", "createdAt", "updatedAt"
      from public."User"
      order by "createdAt" desc
      limit 100
    `);
    res.json(result.rows.map(toUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/chats", requireAuth, async (_req, res) => {
  try {
    const result = await query(`
      select
        c.id,
        c.title,
        c."updatedAt",
        u.name as "userName",
        u.email as "userEmail",
        (
          select m.content
          from public."Message" m
          where m."conversationId" = c.id and lower(m.role) = 'user'
          order by m."createdAt" asc
          limit 1
        ) as prompt,
        (
          select m.content
          from public."Message" m
          where m."conversationId" = c.id and lower(m.role) = 'assistant'
          order by m."createdAt" desc
          limit 1
        ) as response
      from public."Conversation" c
      left join public."User" u on u.id = c."userId"
      order by c."updatedAt" desc
      limit 100
    `);
    res.json(result.rows.map(toChat));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/activity", requireAuth, async (_req, res) => {
  try {
    const result = await query(`
      select
        id::text,
        coalesce(actor, 'anonymous') as actor,
        method || ' ' || path as action,
        status_code::text || ' - ' || duration_ms::text || ' ms' as target,
        created_at as time,
        case when success then 'Success' else 'Failed' end as status,
        method,
        path,
        status_code as "statusCode",
        duration_ms as "durationMs"
      from public."DashboardApiHit"
      order by created_at desc
      limit 250
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/storage/summary", requireAuth, async (_req, res) => {
  try {
    const stats = await fs.statfs(storageStatPath);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    const usedBytes = totalBytes - freeBytes;
    res.json({
      root: storageRoot,
      totalBytes,
      usedBytes,
      remainingBytes: freeBytes,
      usagePercent: totalBytes ? Math.round((usedBytes / totalBytes) * 100) : 0,
      total: formatBytes(totalBytes),
      used: formatBytes(usedBytes),
      remaining: formatBytes(freeBytes),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/storage/files", requireAuth, async (_req, res) => {
  try {
    const files = await walkFiles(storageRoot);
    res.json(files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/storage/file", requireAuth, async (req, res) => {
  try {
    const relativePath = String(req.query.path ?? "");
    const absolute = resolveStoragePath(relativePath);
    const stats = await fs.stat(absolute);
    if (!stats.isFile()) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const mimeType = getMimeType(absolute);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", String(stats.size));
    res.setHeader("Content-Disposition", `${req.query.download === "1" ? "attachment" : "inline"}; filename="${path.basename(absolute).replaceAll('"', "")}"`);
    res.sendFile(absolute);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

ensureDashboardTables().catch((error) => console.error("Failed to prepare dashboard tables", error));

app.listen(port, "0.0.0.0", () => {
  console.log(`NeuraX dashboard API listening on ${port}`);
});
