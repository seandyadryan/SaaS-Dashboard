import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartKind = "area" | "bar" | "line";

type MetricChartProps = {
  title: string;
  data: Record<string, string | number>[];
  dataKey: string;
  secondaryKey?: string;
  kind?: ChartKind;
  color?: string;
};

const tooltipStyle = {
  background: "#0F172A",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "12px",
  color: "#fff",
};

export function MetricChart({ title, data, dataKey, secondaryKey, kind = "area", color = "#2563EB" }: MetricChartProps) {
  const common = (
    <>
      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
      <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} fontSize={12} />
      <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} fontSize={12} width={42} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(148,163,184,0.18)" }} />
    </>
  );

  return (
    <Card className="min-h-[320px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart data={data}>
              {common}
              <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
              {secondaryKey ? <Bar dataKey={secondaryKey} fill="#22C55E" radius={[8, 8, 0, 0]} /> : null}
            </BarChart>
          ) : kind === "line" ? (
            <LineChart data={data}>
              {common}
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} />
              {secondaryKey ? <Line type="monotone" dataKey={secondaryKey} stroke="#22C55E" strokeWidth={3} dot={false} /> : null}
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`${dataKey}-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.42} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {common}
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fill={`url(#${dataKey}-gradient)`} />
              {secondaryKey ? <Area type="monotone" dataKey={secondaryKey} stroke="#22C55E" strokeWidth={3} fill="rgba(34,197,94,0.08)" /> : null}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
