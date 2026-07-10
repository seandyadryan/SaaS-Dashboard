import express from "express";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT ?? 3000);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

app.use(express.json());

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

app.get("/api/dashboard/summary", async (_req, res) => {
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

app.get("/api/dashboard/users", async (_req, res) => {
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

app.get("/api/dashboard/chats", async (_req, res) => {
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
