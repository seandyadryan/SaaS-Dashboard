export type Status = "Active" | "Inactive" | "Suspended" | "Success" | "Failed" | "Pending" | "Healthy" | "Warning";

export type User = {
  id: string;
  avatar: string;
  name: string;
  email: string;
  provider: "Google" | "Email" | "GitHub";
  role: "Admin" | "User" | "Analyst";
  premium: boolean;
  createdAt: string;
  status: "Active" | "Inactive" | "Suspended";
  plan: "Free" | "Pro" | "Enterprise";
  lastLogin: string;
  device: string;
};

export type Chat = {
  id: string;
  user: string;
  prompt: string;
  response: string;
  model: string;
  time: string;
  status: "Success" | "Failed" | "Pending";
};

export type Activity = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  status: "Success" | "Failed" | "Warning";
};

export type ApiLog = {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  responseTime: number;
  status: number;
  rateLimit: string;
  requestCount: number;
  errorCount: number;
};

export type StorageFile = {
  id: string;
  name: string;
  type: string;
  size: string;
  owner: string;
  updatedAt: string;
};
