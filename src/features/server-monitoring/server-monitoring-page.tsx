import { useCallback, useEffect, useState } from "react";
import { Clock, Cpu, Database, HardDrive, Network, RefreshCw, Server, ShieldCheck, Wifi } from "lucide-react";
import { MetricChart } from "@/components/charts/metric-chart";
import { Page } from "@/components/layout/page";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api";

type ResourceMetric = {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercent: number;
};

type ServiceMetric = {
  name: string;
  value: number;
  status: string;
  detail: string;
};

type ServerMetrics = {
  timestamp: string;
  hostname: string;
  platform: string;
  status: string;
  cpu: {
    usagePercent: number;
    cores: number;
    loadAverage: number[];
  };
  memory: ResourceMetric;
  disk: ResourceMetric;
  uptimeSeconds: number;
  uptime: string;
  databaseLatencyMs: number;
  services: ServiceMetric[];
};

type HistoryPoint = {
  name: string;
  cpu: number;
  ram: number;
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function serviceIcon(name: string) {
  if (name === "CPU") return Cpu;
  if (name === "RAM" || name === "PostgreSQL") return Database;
  if (name === "Disk") return HardDrive;
  if (name === "API" || name === "Caddy") return Network;
  return Server;
}

export function ServerMonitoringPage() {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [roundTripMs, setRoundTripMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    const startedAt = performance.now();
    try {
      const response = await apiClient.get<ServerMetrics>("/dashboard/server/metrics");
      setRoundTripMs(Math.max(Math.round(performance.now() - startedAt), 1));
      setMetrics(response.data);
      setHistory((current) => [
        ...current,
        {
          name: new Date(response.data.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          cpu: response.data.cpu.usagePercent,
          ram: response.data.memory.usagePercent,
        },
      ].slice(-24));
      setError(null);
    } catch {
      setError("Metrik server tidak dapat diambil. Data terakhir tetap ditampilkan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
    const interval = window.setInterval(() => void loadMetrics(), 5000);
    return () => window.clearInterval(interval);
  }, [loadMetrics]);

  return (
    <Page
      title="Server Monitoring"
      description="Metrik realtime dari host Ubuntu untuk CPU, RAM, disk, layanan, uptime, dan latensi."
      actions={
        <Button onClick={() => void loadMetrics(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {loading && !metrics ? (
        <PageSkeleton />
      ) : metrics ? (
        <>
          {error ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="Status Server" value={metrics.status} change={`${metrics.hostname} online`} icon={ShieldCheck} />
            <StatCard label="CPU" value={`${metrics.cpu.usagePercent}%`} change={`${metrics.cpu.cores} vCPU | load ${metrics.cpu.loadAverage[0] ?? 0}`} icon={Cpu} />
            <StatCard label="RAM" value={`${metrics.memory.usagePercent}%`} change={`${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(metrics.memory.totalBytes)}`} icon={Database} />
            <StatCard label="Disk" value={`${metrics.disk.usagePercent}%`} change={`${formatBytes(metrics.disk.usedBytes)} / ${formatBytes(metrics.disk.totalBytes)}`} icon={HardDrive} />
            <StatCard label="Uptime" value={metrics.uptime} change={metrics.platform} icon={Clock} />
            <StatCard label="API Ping" value={`${roundTripMs} ms`} change={`DB ${metrics.databaseLatencyMs} ms`} icon={Wifi} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MetricChart title="Realtime Server Load (%)" data={history} dataKey="cpu" secondaryKey="ram" kind="line" color="#60A5FA" />
            </div>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Resources & Services</CardTitle>
                  <p className="mt-1 text-xs text-slate-400">Auto refresh setiap 5 detik</p>
                </div>
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" aria-label="Realtime active" />
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.services.map((service) => {
                  const Icon = serviceIcon(service.name);
                  return (
                    <div key={service.name}>
                      <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-start gap-2 text-slate-200">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0">
                            <p>{service.name}</p>
                            <p className="truncate text-xs text-slate-500">{service.detail}</p>
                          </div>
                        </div>
                        <StatusBadge status={service.status} />
                      </div>
                      <Progress value={service.value} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <Server className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm text-slate-300">Metrik server belum tersedia.</p>
          <Button className="mt-4" onClick={() => void loadMetrics(true)}>
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </Button>
        </Card>
      )}
    </Page>
  );
}
