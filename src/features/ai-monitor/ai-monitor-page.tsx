import { Bot, Clock3, Gauge, ListChecks, MessageCircleWarning, Radio, Sparkles, TimerReset } from "lucide-react";
import { MetricChart } from "@/components/charts/metric-chart";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { realtimeData } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

const aiStats = [
  { label: "Ollama Status", value: "Online", change: "5 workers active", icon: Radio },
  { label: "Current AI Model", value: "Llama 3.1", change: "70B primary", icon: Bot },
  { label: "Avg Response Time", value: "184 ms", change: "-12 ms today", icon: Clock3 },
  { label: "Total Prompt", value: formatNumber(421900), change: "+8.2% today", icon: Sparkles },
  { label: "Failed Prompt", value: formatNumber(118), change: "-3.4% today", icon: MessageCircleWarning },
  { label: "Success Rate", value: "99.72%", change: "+0.4% today", icon: ListChecks },
  { label: "Queue Request", value: "11", change: "Normal load", icon: TimerReset },
  { label: "Active Session", value: "842", change: "+44 live", icon: Gauge },
];

export function AiMonitorPage() {
  return (
    <Page title="AI Monitor" description="Realtime health, throughput, latency, token usage, and queue depth for NeuraX AI inference.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {aiStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MetricChart title="Realtime Latency" data={realtimeData} dataKey="latency" secondaryKey="queue" kind="line" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              ["Input Tokens", 76],
              ["Output Tokens", 64],
              ["Embedding Tokens", 48],
              ["Cache Hit", 82],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-medium text-white">{value}%</span>
                </div>
                <Progress value={value as number} />
              </div>
            ))}
            <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
              <Badge variant="success">Stable</Badge>
              <p className="mt-3 text-sm text-slate-400">Inference queue is under target and model failover is ready.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
