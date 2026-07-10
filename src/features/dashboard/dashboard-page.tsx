import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Bot, Clock3, Cpu, Database, DollarSign, HardDrive, MessageSquare, Users, Zap } from "lucide-react";
import { MetricChart } from "@/components/charts/metric-chart";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { activities, chats, growthData, users as userRows } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Activity as ActivityRow, Chat, User } from "@/types";

const stats = [
  { label: "Total Users", value: formatNumber(14290), change: "+18.4% this month", icon: Users },
  { label: "Active Users", value: formatNumber(8731), change: "+9.7% this week", icon: Activity },
  { label: "Premium Users", value: formatNumber(1880), change: "+22.1% this month", icon: Zap },
  { label: "Total AI Chats", value: formatNumber(921430), change: "+31.6% this month", icon: MessageSquare },
  { label: "Total AI Requests", value: formatNumber(3180000), change: "+14.2% today", icon: Bot },
  { label: "Revenue", value: formatCurrency(67200), change: "+16.8% MRR", icon: DollarSign },
  { label: "API Response Time", value: "184 ms", change: "-12.3% faster", icon: Clock3 },
  { label: "CPU Usage", value: "68%", change: "+4.1% load", icon: Cpu, trend: "down" as const },
  { label: "RAM Usage", value: "74%", change: "+7.6% load", icon: Database, trend: "down" as const },
  { label: "Storage Usage", value: "59%", change: "+2.3 TB available", icon: HardDrive },
];

const activityColumns: ColumnDef<ActivityRow>[] = [
  { header: "Activity", accessorKey: "action" },
  { header: "Actor", accessorKey: "actor" },
  { header: "Target", accessorKey: "target" },
  { header: "Time", accessorKey: "time" },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const userColumns: ColumnDef<User>[] = [
  {
    header: "User",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.name} className="h-9 w-9 text-xs" />
        <div>
          <p className="font-medium text-white">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  { header: "Provider", accessorKey: "provider" },
  { header: "Plan", accessorKey: "plan", cell: ({ row }) => <Badge variant={row.original.premium ? "primary" : "default"}>{row.original.plan}</Badge> },
  { header: "Created", accessorKey: "createdAt" },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

const chatColumns: ColumnDef<Chat>[] = [
  { header: "User", accessorKey: "user" },
  { header: "Prompt", accessorKey: "prompt" },
  { header: "Model", accessorKey: "model" },
  { header: "Time", accessorKey: "time" },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];

export function DashboardPage() {
  return (
    <Page title="Dashboard" description="Enterprise command center for users, AI traffic, subscriptions, infrastructure, and admin activity.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MetricChart title="User Growth" data={growthData} dataKey="users" />
        <MetricChart title="AI Requests per Day" data={growthData} dataKey="requests" kind="bar" color="#22C55E" />
        <MetricChart title="Revenue per Month" data={growthData} dataKey="revenue" kind="area" color="#F59E0B" />
        <MetricChart title="Subscription Growth" data={growthData} dataKey="subscriptions" kind="line" color="#60A5FA" />
      </div>

      <div className="grid gap-4 2xl:grid-cols-3">
        <div className="2xl:col-span-1">
          <DataTable data={activities} columns={activityColumns} searchPlaceholder="Search activity..." />
        </div>
        <div className="2xl:col-span-1">
          <DataTable data={userRows} columns={userColumns} searchPlaceholder="Search users..." />
        </div>
        <div className="2xl:col-span-1">
          <DataTable data={chats} columns={chatColumns} searchPlaceholder="Search chats..." />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operational Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {["Ollama inference stable", "PostgreSQL backup completed", "Nginx edge cache warmed"].map((item) => (
            <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </Page>
  );
}
