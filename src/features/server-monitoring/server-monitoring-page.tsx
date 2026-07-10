import { Clock, Cpu, Database, HardDrive, Network, Server, ShieldCheck, Wifi } from "lucide-react";
import { MetricChart } from "@/components/charts/metric-chart";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { realtimeData, serverServices } from "@/lib/mock-data";

export function ServerMonitoringPage() {
  return (
    <Page title="Server Monitoring" description="Realtime infrastructure view for CPU, RAM, disk, Docker, PostgreSQL, Ollama, Nginx, API, uptime, and ping.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <StatCard label="Status Server" value="Healthy" change="All regions online" icon={ShieldCheck} />
        <StatCard label="CPU" value="68%" change="+4.1% load" icon={Cpu} trend="down" />
        <StatCard label="RAM" value="74%" change="+7.6% load" icon={Database} trend="down" />
        <StatCard label="Uptime" value="99.98%" change="32 days" icon={Clock} />
        <StatCard label="Ping" value="18 ms" change="-2 ms" icon={Wifi} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MetricChart title="Realtime Server Load" data={realtimeData} dataKey="latency" secondaryKey="queue" kind="line" color="#22C55E" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverServices.map((service) => (
              <div key={service.name}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-200">
                    {service.name === "Disk" ? <HardDrive className="h-4 w-4" /> : service.name === "API" ? <Network className="h-4 w-4" /> : <Server className="h-4 w-4" />}
                    {service.name}
                  </div>
                  <StatusBadge status={service.status} />
                </div>
                <Progress value={service.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
