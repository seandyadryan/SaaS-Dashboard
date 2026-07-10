import { FormEvent, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  History,
  Home,
  KeyRound,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Server,
  Settings,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ToastViewport } from "@/components/ui/toast";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

const navItems = [
  { label: "Dashboard", icon: Home, to: "/" },
  { label: "Users", icon: Users, to: "/users" },
  { label: "AI Monitor", icon: Bot, to: "/ai-monitor" },
  { label: "Chat History", icon: MessageSquareText, to: "/chat-history" },
  { label: "Subscription", icon: CreditCard, to: "/subscription" },
  { label: "Analytics", icon: BarChart3, to: "/analytics" },
  { label: "Server Monitoring", icon: Server, to: "/server-monitoring" },
  { label: "Storage", icon: Database, to: "/storage" },
  { label: "API Management", icon: KeyRound, to: "/api-management" },
  { label: "Activity Log", icon: History, to: "/activity-log" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

const idleTimeoutMs = 30 * 60 * 1000;
const lastActivityKey = "neurax_admin_last_activity";
const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart", "visibilitychange"];

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-4">
        <BrandLogo showText={!collapsed} markClassName="h-11 w-11" />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:bg-slate-800/80 hover:text-white",
                isActive && "bg-blue-500/14 text-white shadow-[inset_0_0_0_1px_rgba(37,99,235,0.22)]",
                collapsed && "justify-center px-0",
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <div className={cn("rounded-xl border border-slate-800 bg-slate-950/40 p-3", collapsed && "p-2")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Activity className="h-4 w-4 text-green-300" />
            {!collapsed ? (
              <div>
                <p className="text-xs font-medium text-slate-200">System Healthy</p>
                <p className="text-xs text-slate-500">99.98% uptime</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    setSidebarCollapsed,
    setMobileSidebarOpen,
    toggleTheme,
    addToast,
  } = useUiStore();
  const { session, logout } = useAuthStore();

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSavingPassword(false);
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      addToast({ title: "Password terlalu pendek", description: "Password baru minimal 8 karakter.", variant: "warning" });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ title: "Konfirmasi tidak cocok", description: "Ulangi password baru dengan nilai yang sama.", variant: "warning" });
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      addToast({ title: "Password berhasil diganti", description: "Gunakan password baru untuk login berikutnya.", variant: "success" });
      setChangePasswordOpen(false);
      resetPasswordForm();
    } catch {
      addToast({ title: "Gagal mengganti password", description: "Password lama tidak sesuai atau request gagal.", variant: "danger" });
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    if (!session) return undefined;

    let timeoutId = window.setTimeout(() => undefined, idleTimeoutMs);

    const closeIdleSession = () => {
      logout();
      addToast({
        title: "Sesi berakhir",
        description: "Anda otomatis logout setelah 30 menit tanpa aktivitas.",
        variant: "warning",
      });
    };

    const scheduleTimeout = () => {
      window.clearTimeout(timeoutId);
      const lastActivity = Number(localStorage.getItem(lastActivityKey) ?? Date.now());
      const remainingMs = idleTimeoutMs - (Date.now() - lastActivity);

      if (remainingMs <= 0) {
        closeIdleSession();
        return;
      }

      timeoutId = window.setTimeout(closeIdleSession, remainingMs);
    };

    const recordActivity = () => {
      if (document.visibilityState === "hidden") return;
      localStorage.setItem(lastActivityKey, String(Date.now()));
      scheduleTimeout();
    };

    const existingActivity = Number(localStorage.getItem(lastActivityKey) ?? Date.now());
    if (Date.now() - existingActivity >= idleTimeoutMs) {
      closeIdleSession();
      return undefined;
    }

    localStorage.setItem(lastActivityKey, String(Date.now()));
    scheduleTimeout();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
    };
  }, [addToast, logout, session]);

  return (
    <div className="min-h-screen grid-surface text-white">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800/80 bg-secondary/88 backdrop-blur-xl transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-[82px]" : "w-72",
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-5 top-7 h-10 w-10 rounded-full border border-slate-700"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Collapse sidebar"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition lg:hidden",
          mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileSidebarOpen(false)}
      >
        <aside
          className={cn(
            "h-full w-80 max-w-[86vw] border-r border-slate-800 bg-secondary transition-transform",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <SidebarContent collapsed={false} />
        </aside>
      </div>

      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[82px]" : "lg:pl-72")}>
        <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-background/82 backdrop-blur-xl">
          <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input className="max-w-xl pl-9" placeholder="Search users, chats, APIs..." />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => addToast({ title: "No critical alerts", description: "All monitored services are stable.", variant: "success" })}>
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Toggle dark mode" onClick={toggleTheme}>
                <Moon className="h-5 w-5" />
              </Button>
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2 text-left transition hover:border-blue-400/40 hover:bg-slate-900"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                >
                  <Avatar name={session?.name ?? "Admin NeuraX"} src={session?.photoUrl} className="h-8 w-8 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{session?.name ?? "Admin NeuraX"}</p>
                    <p className="truncate text-xs text-slate-500">{session?.email ?? session?.role ?? "Superuser"}</p>
                  </div>
                </button>
                {profileMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-soft">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                    >
                      <KeyRound className="h-4 w-4" />
                      Change Password
                    </button>
                  </div>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Change password"
                onClick={() => setChangePasswordOpen(true)}
              >
                <KeyRound className="h-5 w-5" />
              </Button>
              <Modal
                open={changePasswordOpen}
                onOpenChange={(open) => {
                  setChangePasswordOpen(open);
                  if (!open) resetPasswordForm();
                }}
                title="Change Password"
                description={session?.email ?? "Update password akun admin"}
              >
                <form className="space-y-4" onSubmit={(event) => void handleChangePassword(event)}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Password lama</span>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      autoComplete="current-password"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Password baru</span>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Konfirmasi password baru</span>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setChangePasswordOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savingPassword}>
                      <KeyRound className="h-4 w-4" />
                      {savingPassword ? "Saving..." : "Save Password"}
                    </Button>
                  </div>
                </form>
              </Modal>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Logout"
                onClick={() => {
                  logout();
                  addToast({ title: "Logout berhasil", description: "Sesi admin sudah ditutup.", variant: "default" });
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}
