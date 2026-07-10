import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Archive, CheckCircle2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api";
import { activities } from "@/lib/mock-data";
import type { Activity as ActivityRow } from "@/types";

export function ActivityLogPage() {
  const [rows, setRows] = useState<ActivityRow[]>(activities);

  const loadActivity = async () => {
    try {
      const response = await apiClient.get<ActivityRow[]>("/dashboard/activity");
      setRows(response.data.length ? response.data : activities);
    } catch {
      setRows(activities);
    }
  };

  useEffect(() => {
    void loadActivity();
  }, []);

  const successCount = rows.filter((row) => row.status === "Success").length;
  const failedCount = rows.filter((row) => row.status === "Failed").length;

  const columns: ColumnDef<ActivityRow>[] = [
    { header: "Actor", accessorKey: "actor" },
    { header: "Activity", accessorKey: "action" },
    { header: "Target", accessorKey: "target" },
    { header: "Time", accessorKey: "time", cell: ({ row }) => new Date(row.original.time).toLocaleString() },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <Page
      title="Activity Log"
      description="Merekam seluruh hit ke API dashboard beserta status sukses atau gagal, response status, dan durasi request."
      actions={
        <Button onClick={() => void loadActivity()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="API Hits" value={String(rows.length)} change="Latest records" icon={Activity} />
        <StatCard label="Success" value={String(successCount)} change="HTTP < 400" icon={CheckCircle2} />
        <StatCard label="Failed" value={String(failedCount)} change="HTTP >= 400" icon={ShieldAlert} trend="down" />
        <StatCard label="Admin Login" value={String(rows.filter((row) => row.action.includes("/api/auth/login")).length)} change="Login attempts" icon={ShieldCheck} />
      </div>
      <DataTable data={rows} columns={columns} searchPlaceholder="Search API activity..." filter={<Archive className="h-5 w-5 text-slate-500" />} />
    </Page>
  );
}
