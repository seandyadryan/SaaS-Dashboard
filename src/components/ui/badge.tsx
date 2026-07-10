import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-slate-700 bg-slate-800/80 text-slate-300",
  success: "border-green-500/20 bg-green-500/12 text-green-300",
  warning: "border-amber-500/20 bg-amber-500/12 text-amber-300",
  danger: "border-red-500/20 bg-red-500/12 text-red-300",
  primary: "border-blue-500/20 bg-blue-500/12 text-blue-300",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
