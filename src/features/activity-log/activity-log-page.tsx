import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Archive, DatabaseBackup, Rocket, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { activities } from "@/lib/mock-data";
import type { Activity as ActivityRow } from "@/types";

export function ActivityLogPage() {
  const columns: ColumnDef<ActivityRow>[] = [
    { header: "Actor", accessorKey: "actor" },
    { header: "Activity", accessorKey: "action" },
    { header: "Target", accessorKey: "target" },
    { header: "Time", accessorKey: "time" },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <Page title="Activity Log" description="Audit every admin login, premium upgrade, delete user action, server restart, backup, and deployment.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Admin Login" value="184" change="+12 today" icon={ShieldCheck} />
        <StatCard label="Restart Server" value="3" change="Last 24h" icon={Activity} />
        <StatCard label="Backup Database" value="12" change="All successful" icon={DatabaseBackup} />
        <StatCard label="Deploy Version" value="v2.8.4" change="2 hours ago" icon={Rocket} />
      </div>
      <DataTable data={activities} columns={columns} searchPlaceholder="Search admin activity..." filter={<Archive className="h-5 w-5 text-slate-500" />} />
    </Page>
  );
}
