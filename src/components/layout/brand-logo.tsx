import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
};

export function BrandLogo({ className, markClassName, showText = true }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black shadow-glow",
          markClassName,
        )}
      >
        <img src="/neurax-logo.png?v=neurax-20260710" alt="NeuraX AI" className="h-full w-full object-cover" />
      </div>
      {showText ? (
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">NeuraX AI</p>
          <p className="truncate text-xs text-slate-500">Admin Console</p>
        </div>
      ) : null}
    </div>
  );
}
