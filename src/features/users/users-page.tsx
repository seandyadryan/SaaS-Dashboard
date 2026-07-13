import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Loader2, RotateCcw, ShieldX, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Page } from "@/components/layout/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api";
import { chats, users } from "@/lib/mock-data";
import { useDashboardData } from "@/lib/dashboard-api";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import type { User } from "@/types";

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

export function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useUiStore();
  const session = useAuthStore((state) => state.session);
  const { users: realUsers, source, reload } = useDashboardData(users, chats);

  const action = (title: string, description: string) => addToast({ title, description, variant: "success" });

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      addToast({ title: "Data belum valid", description: "Nama dan email yang valid wajib diisi.", variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch(`/dashboard/users/${encodeURIComponent(editingUser.id)}`, { name, email });
      setEditingUser(null);
      reload();
      addToast({ title: "User diperbarui", description: `${name} berhasil disimpan ke PostgreSQL.`, variant: "success" });
    } catch (error) {
      const message = (error as ApiError).response?.data?.error ?? "Perubahan user gagal disimpan.";
      addToast({ title: "Gagal memperbarui user", description: message, variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/dashboard/users/${encodeURIComponent(deletingUser.id)}`);
      const deletedName = deletingUser.name;
      setDeletingUser(null);
      reload();
      addToast({ title: "User dihapus", description: `${deletedName} dan data percakapannya telah dihapus.`, variant: "success" });
    } catch (error) {
      const message = (error as ApiError).response?.data?.error ?? "User gagal dihapus.";
      addToast({ title: "Gagal menghapus user", description: message, variant: "danger" });
    } finally {
      setDeleting(false);
    }
  };

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
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === session?.id;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(row.original)} aria-label="View detail" title="View detail">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)} aria-label="Edit user" title="Edit user">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => action("Subscription reset", `${row.original.name} moved to Free plan.`)} aria-label="Reset subscription" title="Reset subscription">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => action("User suspended", `${row.original.name} access has been paused.`)} aria-label="Suspend user" title="Suspend user">
              <ShieldX className="h-4 w-4" />
            </Button>
            <Button
              variant="danger"
              size="icon"
              onClick={() => setDeletingUser(row.original)}
              disabled={isCurrentUser}
              aria-label={isCurrentUser ? "Cannot delete signed-in user" : "Delete user"}
              title={isCurrentUser ? "Akun yang sedang login tidak dapat dihapus" : "Delete user"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Page title="User Management" description="Search, inspect, edit, and delete customer accounts stored in PostgreSQL.">
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
              ["Login History", "Stored in API activity log"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && !saving && setEditingUser(null)}
        title="Edit User"
        description={editingUser?.id}
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void saveUser();
          }}
        >
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Name</span>
            <Input value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={120} autoFocus required />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email</span>
            <Input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} maxLength={255} required />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && !deleting && setDeletingUser(null)}
        title="Delete User"
        description={deletingUser?.email}
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            User <strong>{deletingUser?.name}</strong>, seluruh conversation, dan message terkait akan dihapus permanen.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeletingUser(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={() => void deleteUser()} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
