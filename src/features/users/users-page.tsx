import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, RotateCcw, ShieldX, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { chats, users } from "@/lib/mock-data";
import { useDashboardData } from "@/lib/dashboard-api";
import { useUiStore } from "@/store/ui-store";
import type { User } from "@/types";

export function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { addToast } = useUiStore();
  const { users: realUsers, source } = useDashboardData(users, chats);

  const action = (title: string, description: string) => addToast({ title, description, variant: "success" });

  const columns: ColumnDef<User>[] = [
    {
      header: "Avatar",
      cell: ({ row }) => <Avatar name={row.original.name} />,
    },
    {
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.id}</p>
        </div>
      ),
    },
    { header: "Email", accessorKey: "email" },
    { header: "Provider", accessorKey: "provider" },
    { header: "Role", accessorKey: "role" },
    { header: "Premium", cell: ({ row }) => <Badge variant={row.original.premium ? "primary" : "default"}>{row.original.premium ? "Yes" : "No"}</Badge> },
    { header: "Created At", accessorKey: "createdAt" },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(row.original)} aria-label="View detail">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => action("Edit ready", `${row.original.name} opened for editing.`)} aria-label="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => action("Subscription reset", `${row.original.name} moved to Free plan.`)} aria-label="Reset subscription">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => action("User suspended", `${row.original.name} access has been paused.`)} aria-label="Suspend user">
            <ShieldX className="h-4 w-4" />
          </Button>
          <Button variant="danger" size="icon" onClick={() => addToast({ title: "Delete requested", description: `${row.original.name} is queued for deletion approval.`, variant: "danger" })} aria-label="Delete user">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page title="User Management" description="Search, filter, inspect, edit, suspend, delete, and audit customer accounts before connecting the REST API.">
      <DataTable
        data={realUsers}
        columns={columns}
        searchPlaceholder="Search name, email, provider, role..."
        filter={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All Roles</Button>
            <Button variant="outline" size="sm">Premium</Button>
            <Button variant="outline" size="sm">{source === "database" ? "PostgreSQL" : "Fallback"}</Button>
          </div>
        }
      />

      <Modal
        open={Boolean(selectedUser)}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        title={selectedUser?.name ?? "User Detail"}
        description={selectedUser?.email}
      >
        {selectedUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Provider", selectedUser.provider],
              ["Role", selectedUser.role],
              ["Plan", selectedUser.plan],
              ["Status", selectedUser.status],
              ["Created At", selectedUser.createdAt],
              ["Last Login", selectedUser.lastLogin],
              ["Device Information", selectedUser.device],
              ["Login History", "7 successful logins, 0 blocked attempts"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </Page>
  );
}
