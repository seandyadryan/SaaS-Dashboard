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
  Gauge,
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
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastViewport } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
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

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
          <Gauge className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">NeuraX AI</p>
            <p className="truncate text-xs text-slate-500">Admin Console</p>
          </div>
        ) : null}
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
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    setSidebarCollapsed,
    setMobileSidebarOpen,
    toggleTheme,
    addToast,
  } = useUiStore();

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
              <div className="hidden items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2 sm:flex">
                <Avatar name="Admin NeuraX" className="h-8 w-8 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">Admin</p>
                  <p className="truncate text-xs text-slate-500">{location.pathname === "/" ? "Dashboard" : "Console"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={() => addToast({ title: "Logout requested", description: "Connect this action to your auth API.", variant: "default" })}>
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
