import { Activity, BarChart3, LineChart, Repeat2, TrendingUp, Users } from "lucide-react";
import { MetricChart } from "@/components/charts/metric-chart";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { growthData } from "@/lib/mock-data";

export function AnalyticsPage() {
  return (
    <Page title="Analytics" description="Professional analytics workspace for acquisition, prompt usage, revenue growth, and retention.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Daily Active User" value="8,731" change="+9.7%" icon={Activity} />
        <StatCard label="Monthly Active User" value="14,290" change="+18.4%" icon={Users} />
        <StatCard label="Prompt Usage" value="421.9k" change="+8.2%" icon={BarChart3} />
        <StatCard label="Revenue" value="$67.2k" change="+16.8%" icon={TrendingUp} />
        <StatCard label="Growth" value="24.6%" change="+3.1 pts" icon={LineChart} />
        <StatCard label="Retention" value="88.4%" change="+2.4 pts" icon={Repeat2} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <MetricChart title="Daily Active User" data={growthData} dataKey="users" />
        <MetricChart title="Monthly Active User" data={growthData} dataKey="subscriptions" kind="line" color="#22C55E" />
        <MetricChart title="Prompt Usage" data={growthData} dataKey="requests" kind="bar" color="#60A5FA" />
        <MetricChart title="Revenue Growth" data={growthData} dataKey="revenue" secondaryKey="subscriptions" color="#F59E0B" />
      </div>
    </Page>
  );
}
