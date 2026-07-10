import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { PageSkeleton } from "@/components/ui/skeleton";

const DashboardPage = lazy(() => import("@/features/dashboard/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const UsersPage = lazy(() => import("@/features/users/users-page").then((module) => ({ default: module.UsersPage })));
const AiMonitorPage = lazy(() => import("@/features/ai-monitor/ai-monitor-page").then((module) => ({ default: module.AiMonitorPage })));
const ChatHistoryPage = lazy(() => import("@/features/chat-history/chat-history-page").then((module) => ({ default: module.ChatHistoryPage })));
const SubscriptionPage = lazy(() => import("@/features/subscription/subscription-page").then((module) => ({ default: module.SubscriptionPage })));
const AnalyticsPage = lazy(() => import("@/features/analytics/analytics-page").then((module) => ({ default: module.AnalyticsPage })));
const ServerMonitoringPage = lazy(() => import("@/features/server-monitoring/server-monitoring-page").then((module) => ({ default: module.ServerMonitoringPage })));
const StoragePage = lazy(() => import("@/features/storage/storage-page").then((module) => ({ default: module.StoragePage })));
const ApiManagementPage = lazy(() => import("@/features/api-management/api-management-page").then((module) => ({ default: module.ApiManagementPage })));
const ActivityLogPage = lazy(() => import("@/features/activity-log/activity-log-page").then((module) => ({ default: module.ActivityLogPage })));
const SettingsPage = lazy(() => import("@/features/settings/settings-page").then((module) => ({ default: module.SettingsPage })));

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 lg:pl-80"><PageSkeleton /></div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="ai-monitor" element={<AiMonitorPage />} />
          <Route path="chat-history" element={<ChatHistoryPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="server-monitoring" element={<ServerMonitoringPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="api-management" element={<ApiManagementPage />} />
          <Route path="activity-log" element={<ActivityLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
