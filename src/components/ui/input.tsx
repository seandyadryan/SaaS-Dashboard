import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
