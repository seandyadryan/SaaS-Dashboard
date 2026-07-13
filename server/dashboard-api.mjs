import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT ?? 3000);
const initialUserPassword = process.env.DASHBOARD_INITIAL_USER_PASSWORD ?? "P@ssw0rd";
const authSecret = process.env.DASHBOARD_AUTH_SECRET ?? crypto.randomBytes(32).toString("hex");
const storageRoot = path.resolve(process.env.STORAGE_ROOT ?? "/storage");
const storageStatPath = path.resolve(process.env.STORAGE_STAT_PATH ?? storageRoot);
const procRoot = path.resolve(process.env.HOST_PROC_PATH ?? "/proc");
const ollamaUrl = process.env.OLLAMA_URL ?? "http://172.19.0.1:11434";
const proxyUrl = process.env.PROXY_HEALTH_URL ?? "http://ai-chat-caddy";
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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("base64url");
  return `scrypt$16384$8$1$${salt}$${key}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const [scheme, n, r, p, salt, expectedKey] = storedHash.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !salt || !expectedKey) return false;

  const key = crypto.scryptSync(password, salt, 64, { N: Number(n), r: Number(r), p: Number(p) });
  const expected = Buffer.from(expectedKey, "base64url");
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
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
  await query(`alter table public."User" add column if not exists password text`);
  await query(`alter table public."User" add column if not exists "bLock" integer not null default 0`);
  await query(`alter table public."User" add column if not exists "failedLoginCount" integer not null default 0`);
  await query(`alter table public."User" add column if not exists "blockedUntil" timestamp without time zone`);
  await clearExpiredUserBlocks();

  const initialHash = hashPassword(initialUserPassword);
  await query(`update public."User" set password = $1 where password is null or password = ''`, [initialHash]);
}

async function clearExpiredUserBlocks() {
  await query(`update public."User" set "bLock" = 0, "failedLoginCount" = 0, "blockedUntil" = null where "bLock" = 1 and "blockedUntil" <= now()`);
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function clampPercent(value) {
  return Math.min(Math.max(Math.round(value * 10) / 10, 0), 100);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(Math.floor(totalSeconds), 0);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function readCpuSnapshot() {
  const contents = await fs.readFile(path.join(procRoot, "stat"), "utf8");
  const values = contents
    .split("\n")[0]
    .trim()
    .split(/\s+/)
    .slice(1)
    .map(Number);
  const idle = (values[3] ?? 0) + (values[4] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  return { idle, total };
}

let previousCpuSnapshot = null;
let currentCpuPercent = 0;

async function sampleCpuUsage() {
  const next = await readCpuSnapshot();
  if (previousCpuSnapshot) {
    const totalDelta = next.total - previousCpuSnapshot.total;
    const idleDelta = next.idle - previousCpuSnapshot.idle;
    if (totalDelta > 0) currentCpuPercent = clampPercent(((totalDelta - idleDelta) / totalDelta) * 100);
  }
  previousCpuSnapshot = next;
}

async function readMemoryMetrics() {
  const contents = await fs.readFile(path.join(procRoot, "meminfo"), "utf8");
  const values = new Map();
  for (const line of contents.split("\n")) {
    const match = line.match(/^([^:]+):\s+(\d+)/);
    if (match) values.set(match[1], Number(match[2]) * 1024);
  }
  const totalBytes = values.get("MemTotal") ?? os.totalmem();
  const availableBytes = values.get("MemAvailable") ?? os.freemem();
  const usedBytes = Math.max(totalBytes - availableBytes, 0);
  return {
    totalBytes,
    usedBytes,
    availableBytes,
    usagePercent: totalBytes ? clampPercent((usedBytes / totalBytes) * 100) : 0,
  };
}

async function readUptimeSeconds() {
  const contents = await fs.readFile(path.join(procRoot, "uptime"), "utf8");
  return Number(contents.split(/\s+/)[0]) || 0;
}

async function probeUrl(url) {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(2000),
    });
    return { online: response.status > 0 && response.status < 500, latencyMs: Math.max(Math.round(performance.now() - startedAt), 1) };
  } catch {
    return { online: false, latencyMs: null };
  }
}

function resourceStatus(value) {
  if (value >= 90) return "Critical";
  if (value >= 80) return "Warning";
  return "Healthy";
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

function toStoragePath(value) {
  return value.replaceAll(path.sep, "/");
}

function resolveStoragePath(relativePath = "") {
  const resolved = path.resolve(storageRoot, relativePath);
  if (resolved !== storageRoot && !resolved.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Invalid storage path");
  }
  return resolved;
}

async function listStorageDirectory(relativePath = "", limit = 250) {
  const directory = resolveStoragePath(relativePath);
  const directoryStats = await fs.stat(directory);
  if (!directoryStats.isDirectory()) {
    throw new Error("Storage path is not a directory");
  }

  const base = relativePath ? path.normalize(relativePath) : "";
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (results.length >= limit) break;
    if (entry.name.startsWith(".git") || entry.name === "node_modules") continue;

    const absolute = path.join(directory, entry.name);
    const relative = path.join(base, entry.name);
    const stats = await fs.stat(absolute);

    if (entry.isDirectory()) {
      const folderPath = toStoragePath(relative);
      results.push({
        id: Buffer.from(`folder:${folderPath}`).toString("base64url"),
        name: entry.name,
        path: folderPath,
        type: "FOLDER",
        mimeType: "inode/directory",
        kind: "folder",
        size: "-",
        sizeBytes: 0,
        owner: base.split(path.sep)[0] || entry.name || "Server",
        updatedAt: stats.mtime.toISOString(),
      });
      continue;
    }

    const mimeType = getMimeType(absolute);
    results.push({
      id: Buffer.from(relative).toString("base64url"),
      name: entry.name,
      path: toStoragePath(relative),
      type: path.extname(entry.name).replace(".", "").toUpperCase() || "FILE",
      mimeType,
      kind: getFileKind(mimeType),
      size: formatBytes(stats.size),
      sizeBytes: stats.size,
      owner: base.split(path.sep)[0] || "Server",
      updatedAt: stats.mtime.toISOString(),
    });
  }

  return results.sort((a, b) => {
    if (a.kind === "folder" && b.kind !== "folder") return -1;
    if (a.kind !== "folder" && b.kind === "folder") return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
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
        session?.username ?? (req.path === "/api/auth/login" ? String(req.body?.username ?? "").slice(0, 255) : null),
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

async function findLoginUser(username) {
  const normalizedUsername = String(username ?? "").trim().toLowerCase();
  if (!normalizedUsername || !normalizedUsername.includes("@")) return null;

  const result = await query(
    `
      select id, email, name, "photoUrl", password, "bLock", "failedLoginCount", "blockedUntil", "createdAt", "updatedAt"
      from public."User"
      where lower(email) = $1
      limit 1
    `,
    [normalizedUsername],
  );

  return result.rows[0] ?? null;
}

function toAdminSession(row) {
  return {
    id: row?.id ?? null,
    username: row?.email ?? null,
    email: row?.email ?? null,
    name: row?.name || row?.email || "User",
    photoUrl: row?.photoUrl ?? null,
    role: "Superuser",
    issuedAt: new Date().toISOString(),
  };
}

function secondsUntil(dateValue) {
  return Math.max(Math.ceil((new Date(dateValue).getTime() - Date.now()) / 1000), 0);
}

function isUserBlocked(row) {
  return Number(row?.bLock ?? 0) === 1 && row?.blockedUntil && secondsUntil(row.blockedUntil) > 0;
}

async function clearExpiredUserBlock(row) {
  if (Number(row?.bLock ?? 0) !== 1 || !row?.blockedUntil || secondsUntil(row.blockedUntil) > 0) {
    return row;
  }

  await query(`update public."User" set "bLock" = 0, "failedLoginCount" = 0, "blockedUntil" = null where id = $1`, [row.id]);
  return {
    ...row,
    bLock: 0,
    failedLoginCount: 0,
    blockedUntil: null,
  };
}

async function recordFailedUserLogin(row) {
  const nextCount = Number(row?.failedLoginCount ?? 0) + 1;
  if (nextCount >= maxFailedLogins) {
    const result = await query(
      `
        update public."User"
        set "bLock" = 1,
            "failedLoginCount" = $2,
            "blockedUntil" = now() + ($3::text || ' minutes')::interval,
            "updatedAt" = now()
        where id = $1
        returning "failedLoginCount", "blockedUntil"
      `,
      [row.id, nextCount, Number(process.env.LOGIN_BLOCK_MINUTES ?? 15)],
    );
    return {
      attemptsRemaining: 0,
      blockedUntil: result.rows[0]?.blockedUntil,
    };
  }

  await query(
    `
      update public."User"
      set "bLock" = 0,
          "failedLoginCount" = $2,
          "blockedUntil" = null,
          "updatedAt" = now()
      where id = $1
    `,
    [row.id, nextCount],
  );

  return {
    attemptsRemaining: Math.max(maxFailedLogins - nextCount, 0),
    blockedUntil: null,
  };
}

async function clearUserLoginFailures(row) {
  await query(`update public."User" set "bLock" = 0, "failedLoginCount" = 0, "blockedUntil" = null where id = $1`, [row.id]);
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

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  let loginUser = null;

  try {
    loginUser = await findLoginUser(username);
  } catch (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!loginUser) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  loginUser = await clearExpiredUserBlock(loginUser);
  if (isUserBlocked(loginUser)) {
    const retryAfterSeconds = secondsUntil(loginUser.blockedUntil);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      error: "User is temporarily blocked",
      attemptsRemaining: 0,
      retryAfterSeconds,
      blockedUntil: new Date(loginUser.blockedUntil).toISOString(),
    });
    return;
  }

  if (!verifyPassword(password, loginUser.password)) {
    const failed = await recordFailedUserLogin(loginUser);
    if (failed.blockedUntil) {
      const retryAfterSeconds = secondsUntil(failed.blockedUntil);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        error: "User is temporarily blocked",
        attemptsRemaining: 0,
        retryAfterSeconds,
        blockedUntil: new Date(failed.blockedUntil).toISOString(),
      });
      return;
    }

    res.status(401).json({ error: "Invalid credentials", attemptsRemaining: failed.attemptsRemaining });
    return;
  }

  await clearUserLoginFailures(loginUser);

  try {
    const session = toAdminSession(loginUser);
    res.json({ session, token: createToken(session) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ session: req.session });
});

app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    res.status(400).json({ error: "Password baru minimal 8 karakter" });
    return;
  }

  try {
    const result = await query(
      `
        select id, password
        from public."User"
        where id = $1
        limit 1
      `,
      [req.session.id],
    );
    const user = result.rows[0];
    if (!user || !verifyPassword(currentPassword, user.password)) {
      res.status(401).json({ error: "Password lama tidak sesuai" });
      return;
    }

    await query(`update public."User" set password = $1, "updatedAt" = now() where id = $2`, [hashPassword(newPassword), user.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

app.get("/api/dashboard/storage/files", requireAuth, async (req, res) => {
  try {
    const relativePath = String(req.query.path ?? "");
    const files = await listStorageDirectory(relativePath);
    res.json(files);
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

app.get("/api/dashboard/server/metrics", requireAuth, async (_req, res) => {
  const databaseStartedAt = performance.now();
  try {
    await query("select 1");
    const databaseLatencyMs = Math.max(Math.round(performance.now() - databaseStartedAt), 1);
    const [memory, uptimeSeconds, diskStats, ollama, proxy] = await Promise.all([
      readMemoryMetrics(),
      readUptimeSeconds(),
      fs.statfs(storageStatPath),
      probeUrl(`${ollamaUrl.replace(/\/$/, "")}/api/tags`),
      probeUrl(proxyUrl),
    ]);

    const diskTotalBytes = Number(diskStats.blocks) * Number(diskStats.bsize);
    const diskAvailableBytes = Number(diskStats.bavail) * Number(diskStats.bsize);
    const diskUsedBytes = diskTotalBytes - diskAvailableBytes;
    const diskUsagePercent = diskTotalBytes ? clampPercent((diskUsedBytes / diskTotalBytes) * 100) : 0;
    const cpu = {
      usagePercent: currentCpuPercent,
      cores: os.cpus().length,
      loadAverage: os.loadavg().map((value) => Math.round(value * 100) / 100),
    };
    const disk = {
      totalBytes: diskTotalBytes,
      usedBytes: diskUsedBytes,
      availableBytes: diskAvailableBytes,
      usagePercent: diskUsagePercent,
    };
    const services = [
      { name: "CPU", value: cpu.usagePercent, status: resourceStatus(cpu.usagePercent), detail: `${cpu.cores} vCPU` },
      { name: "RAM", value: memory.usagePercent, status: resourceStatus(memory.usagePercent), detail: `${formatBytes(memory.usedBytes)} / ${formatBytes(memory.totalBytes)}` },
      { name: "Disk", value: disk.usagePercent, status: resourceStatus(disk.usagePercent), detail: `${formatBytes(disk.usedBytes)} / ${formatBytes(disk.totalBytes)}` },
      { name: "Docker", value: 100, status: "Healthy", detail: "Container runtime active" },
      { name: "PostgreSQL", value: 100, status: "Healthy", detail: `${databaseLatencyMs} ms` },
      { name: "Ollama", value: ollama.online ? 100 : 0, status: ollama.online ? "Healthy" : "Offline", detail: ollama.online ? `${ollama.latencyMs} ms` : "Unreachable" },
      { name: "Caddy", value: proxy.online ? 100 : 0, status: proxy.online ? "Healthy" : "Offline", detail: proxy.online ? `${proxy.latencyMs} ms` : "Unreachable" },
      { name: "API", value: 100, status: "Healthy", detail: "Dashboard API online" },
    ];
    const healthy = services.every((service) => service.status !== "Critical" && service.status !== "Offline");

    res.json({
      timestamp: new Date().toISOString(),
      hostname: process.env.SERVER_NAME ?? "vmaichat",
      platform: `${os.platform()} ${os.arch()}`,
      status: healthy ? "Healthy" : "Attention",
      cpu,
      memory,
      disk,
      uptimeSeconds,
      uptime: formatDuration(uptimeSeconds),
      databaseLatencyMs,
      services,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ensureDashboardTables()
  .then(() => {
    sampleCpuUsage().catch((error) => console.error("Failed to sample CPU usage", error));
    setInterval(() => {
      sampleCpuUsage().catch((error) => console.error("Failed to sample CPU usage", error));
    }, 1000);
    app.listen(port, "0.0.0.0", () => {
      console.log(`NeuraX dashboard API listening on ${port}`);
    });
    setInterval(() => {
      clearExpiredUserBlocks().catch((error) => console.error("Failed to clear expired user blocks", error));
    }, 60 * 1000);
  })
  .catch((error) => {
    console.error("Failed to prepare dashboard tables", error);
    process.exit(1);
  });
