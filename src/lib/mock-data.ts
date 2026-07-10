import type { Activity, ApiLog, Chat, StorageFile, User } from "@/types";

export const users: User[] = [
  { id: "USR-001", avatar: "AN", name: "Anya Pratama", email: "anya@neurax.ai", provider: "Google", role: "Admin", premium: true, createdAt: "2026-06-12", status: "Active", plan: "Enterprise", lastLogin: "2 minutes ago", device: "MacBook Pro, Chrome" },
  { id: "USR-002", avatar: "RK", name: "Raka Wijaya", email: "raka@startup.id", provider: "Email", role: "User", premium: true, createdAt: "2026-05-28", status: "Active", plan: "Pro", lastLogin: "18 minutes ago", device: "Windows, Edge" },
  { id: "USR-003", avatar: "SM", name: "Sinta Maharani", email: "sinta@studio.ai", provider: "GitHub", role: "Analyst", premium: false, createdAt: "2026-04-03", status: "Inactive", plan: "Free", lastLogin: "3 days ago", device: "iPad, Safari" },
  { id: "USR-004", avatar: "BN", name: "Bima Nugroho", email: "bima@labs.dev", provider: "Google", role: "User", premium: true, createdAt: "2026-06-30", status: "Active", plan: "Pro", lastLogin: "1 hour ago", device: "Android, Chrome" },
  { id: "USR-005", avatar: "CL", name: "Clara Lestari", email: "clara@venture.co", provider: "Email", role: "User", premium: false, createdAt: "2026-02-19", status: "Suspended", plan: "Free", lastLogin: "12 days ago", device: "Windows, Firefox" },
  { id: "USR-006", avatar: "DF", name: "Daffa Firdaus", email: "daffa@cloud.id", provider: "Google", role: "Analyst", premium: true, createdAt: "2026-07-01", status: "Active", plan: "Enterprise", lastLogin: "7 minutes ago", device: "Linux, Chrome" },
];

export const chats: Chat[] = [
  { id: "CHT-901", user: "Anya Pratama", prompt: "Summarize uploaded invoice dataset", response: "Created a concise expense summary with anomalies.", model: "llama3.1:70b", time: "09:42", status: "Success" },
  { id: "CHT-902", user: "Raka Wijaya", prompt: "Generate onboarding email sequence", response: "Five email drafts were generated.", model: "gpt-4.1-mini", time: "09:33", status: "Success" },
  { id: "CHT-903", user: "Sinta Maharani", prompt: "Analyze churn notes", response: "Model queue timeout after 35 seconds.", model: "mistral-nemo", time: "08:58", status: "Failed" },
  { id: "CHT-904", user: "Bima Nugroho", prompt: "Create SQL report for ARR by segment", response: "Pending execution in the high priority queue.", model: "llama3.1:8b", time: "08:44", status: "Pending" },
  { id: "CHT-905", user: "Daffa Firdaus", prompt: "Classify API support tickets", response: "Classification completed across 814 tickets.", model: "qwen2.5-coder", time: "08:21", status: "Success" },
];

export const activities: Activity[] = [
  { id: "ACT-1001", actor: "Admin", action: "Admin Login", target: "Console", time: "2 minutes ago", status: "Success" },
  { id: "ACT-1002", actor: "Anya", action: "User Upgrade Premium", target: "Raka Wijaya", time: "18 minutes ago", status: "Success" },
  { id: "ACT-1003", actor: "System", action: "Restart Ollama", target: "AI Worker 02", time: "36 minutes ago", status: "Warning" },
  { id: "ACT-1004", actor: "Admin", action: "Backup Database", target: "PostgreSQL", time: "1 hour ago", status: "Success" },
  { id: "ACT-1005", actor: "Deploy Bot", action: "Deploy Version", target: "v2.8.4", time: "2 hours ago", status: "Success" },
  { id: "ACT-1006", actor: "Admin", action: "Delete User", target: "spam@domain.test", time: "4 hours ago", status: "Failed" },
];

export const apiLogs: ApiLog[] = [
  { id: "API-01", endpoint: "/v1/chat/completions", method: "POST", responseTime: 184, status: 200, rateLimit: "8k/min", requestCount: 128400, errorCount: 98 },
  { id: "API-02", endpoint: "/v1/users", method: "GET", responseTime: 72, status: 200, rateLimit: "3k/min", requestCount: 42190, errorCount: 12 },
  { id: "API-03", endpoint: "/v1/subscriptions", method: "PATCH", responseTime: 96, status: 200, rateLimit: "1k/min", requestCount: 9874, errorCount: 7 },
  { id: "API-04", endpoint: "/v1/files/upload", method: "POST", responseTime: 412, status: 201, rateLimit: "600/min", requestCount: 6120, errorCount: 42 },
  { id: "API-05", endpoint: "/v1/admin/audit", method: "GET", responseTime: 88, status: 200, rateLimit: "2k/min", requestCount: 18801, errorCount: 3 },
];

export const storageFiles: StorageFile[] = [
  { id: "FILE-01", name: "customer-transcripts-q2.csv", type: "CSV", size: "184 MB", owner: "Analytics", updatedAt: "Today" },
  { id: "FILE-02", name: "model-evaluation-report.pdf", type: "PDF", size: "28 MB", owner: "AI Ops", updatedAt: "Yesterday" },
  { id: "FILE-03", name: "subscription-export.json", type: "JSON", size: "12 MB", owner: "Billing", updatedAt: "Jul 8, 2026" },
  { id: "FILE-04", name: "chat-attachments.zip", type: "ZIP", size: "2.4 GB", owner: "Support", updatedAt: "Jul 6, 2026" },
  { id: "FILE-05", name: "avatar-batch-17.png", type: "PNG", size: "8 MB", owner: "Users", updatedAt: "Jul 4, 2026" },
];

export const growthData = [
  { name: "Jan", users: 4200, requests: 82000, revenue: 18400, subscriptions: 640 },
  { name: "Feb", users: 5100, requests: 94000, revenue: 22300, subscriptions: 720 },
  { name: "Mar", users: 6800, requests: 128000, revenue: 29100, subscriptions: 840 },
  { name: "Apr", users: 7600, requests: 161000, revenue: 35400, subscriptions: 980 },
  { name: "May", users: 9400, requests: 212000, revenue: 42800, subscriptions: 1200 },
  { name: "Jun", users: 11800, requests: 264000, revenue: 53600, subscriptions: 1510 },
  { name: "Jul", users: 14290, requests: 318000, revenue: 67200, subscriptions: 1880 },
];

export const realtimeData = [
  { name: "09:00", latency: 210, tokens: 32000, queue: 16 },
  { name: "09:05", latency: 186, tokens: 41000, queue: 12 },
  { name: "09:10", latency: 228, tokens: 52000, queue: 19 },
  { name: "09:15", latency: 174, tokens: 48000, queue: 9 },
  { name: "09:20", latency: 192, tokens: 61000, queue: 14 },
  { name: "09:25", latency: 168, tokens: 66000, queue: 8 },
  { name: "09:30", latency: 181, tokens: 72000, queue: 11 },
];

export const serverServices = [
  { name: "CPU", value: 68, status: "Healthy" },
  { name: "RAM", value: 74, status: "Warning" },
  { name: "Disk", value: 59, status: "Healthy" },
  { name: "Docker", value: 96, status: "Healthy" },
  { name: "PostgreSQL", value: 91, status: "Healthy" },
  { name: "Ollama", value: 88, status: "Healthy" },
  { name: "Nginx", value: 99, status: "Healthy" },
  { name: "API", value: 97, status: "Healthy" },
];
