import type { ColumnDef } from "@tanstack/react-table";
import { Copy, KeyRound, Network, Shield, Timer, XCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiLogs } from "@/lib/mock-data";
import { useUiStore } from "@/store/ui-store";
import type { ApiLog } from "@/types";

export function ApiManagementPage() {
  const { addToast } = useUiStore();
  const columns: ColumnDef<ApiLog>[] = [
    { header: "Endpoint", accessorKey: "endpoint" },
    { header: "Method", accessorKey: "method", cell: ({ row }) => <Badge variant={row.original.method === "DELETE" ? "danger" : row.original.method === "POST" ? "primary" : "default"}>{row.original.method}</Badge> },
    { header: "Response Time", accessorKey: "responseTime", cell: ({ row }) => `${row.original.responseTime} ms` },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={String(row.original.status)} /> },
    { header: "Rate Limit", accessorKey: "rateLimit" },
    { header: "Request Count", accessorKey: "requestCount" },
    { header: "Error Count", accessorKey: "errorCount" },
  ];

  return (
    <Page
      title="API Management"
      description="Monitor endpoints, methods, response time, status, rate limits, request volume, error count, logs, and API keys."
      actions={
        <Button onClick={() => addToast({ title: "API key copied", description: "sk-live-neurax-demo", variant: "success" })}>
          <Copy className="h-4 w-4" />
          API Key
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Endpoint" value="42" change="+4 this month" icon={Network} />
        <StatCard label="Response Time" value="184 ms" change="-12.3%" icon={Timer} />
        <StatCard label="Rate Limit" value="8k/min" change="Healthy" icon={Shield} />
        <StatCard label="Error Count" value="162" change="-6.1%" icon={XCircle} />
      </div>
      <DataTable
        data={apiLogs}
        columns={columns}
        searchPlaceholder="Search endpoint, method, status..."
        filter={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <KeyRound className="h-4 w-4" />
              Logs
            </Button>
          </div>
        }
      />
    </Page>
  );
}
