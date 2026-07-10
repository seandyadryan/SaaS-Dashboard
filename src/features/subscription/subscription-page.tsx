import { CreditCard, Gift, RefreshCcw, TicketPercent, TimerOff, Users } from "lucide-react";
import { MetricChart } from "@/components/charts/metric-chart";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { growthData } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function SubscriptionPage() {
  const plans = [
    { name: "Free", users: 12410, revenue: "$0", renewal: "0%", badge: "Starter" },
    { name: "Pro", users: 1510, revenue: "$41.2k", renewal: "86%", badge: "Popular" },
    { name: "Enterprise", users: 370, revenue: "$26.0k", renewal: "94%", badge: "Scale" },
  ];

  return (
    <Page title="Subscription" description="Premium user growth, revenue, expired seats, renewals, voucher usage, and promo performance.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Paket" value="3" change="Free, Pro, Enterprise" icon={CreditCard} />
        <StatCard label="User Premium" value={formatNumber(1880)} change="+22.1% MRR" icon={Users} />
        <StatCard label="Revenue" value={formatCurrency(67200)} change="+16.8%" icon={CreditCard} />
        <StatCard label="Expired Subscription" value="93" change="-8.2%" icon={TimerOff} />
        <StatCard label="Renewal" value="89%" change="+4.6%" icon={RefreshCcw} />
        <StatCard label="Voucher" value="418" change="+61 redeemed" icon={Gift} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MetricChart title="Monthly Revenue" data={growthData} dataKey="revenue" kind="bar" color="#F59E0B" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Promo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{plan.name}</p>
                    <p className="text-sm text-slate-400">{plan.users.toLocaleString()} users</p>
                  </div>
                  <Badge variant="primary">{plan.badge}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                  <span>{plan.revenue}</span>
                  <span>{plan.renewal} renewal</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <TicketPercent className="h-4 w-4" />
              Mid-year promo running at 12.4% conversion.
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
