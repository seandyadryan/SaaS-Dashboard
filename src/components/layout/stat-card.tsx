import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  icon: LucideIcon;
};

export function StatCard({ label, value, change, trend = "up", icon: Icon }: StatCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="group p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/12 p-3 text-blue-200 transition group-hover:bg-blue-500/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={cn("mt-5 inline-flex items-center gap-1 text-xs font-medium", trend === "up" ? "text-green-300" : "text-red-300")}>
        <TrendIcon className="h-3.5 w-3.5" />
        {change}
      </div>
    </Card>
  );
}
