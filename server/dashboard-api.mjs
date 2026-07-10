import express from "express";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT ?? 3000);
const adminUsername = process.env.DASHBOARD_ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.DASHBOARD_ADMIN_PASSWORD ?? "P@ssw0rd";
const authSecret = process.env.DASHBOARD_AUTH_SECRET ?? "replace-this-secret";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

app.use(express.json());

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
  const { username, password } = req.body ?? {};
  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

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

app.listen(port, "0.0.0.0", () => {
  console.log(`NeuraX dashboard API listening on ${port}`);
});
