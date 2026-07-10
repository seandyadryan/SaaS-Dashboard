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
          "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-300/25 bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 shadow-glow",
          markClassName,
        )}
      >
        <svg viewBox="0 0 48 48" role="img" aria-label="NeuraX AI logo" className="h-full w-full">
          <defs>
            <linearGradient id="neurax-core" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="0.55" stopColor="#DBEAFE" />
              <stop offset="1" stopColor="#A7F3D0" />
            </linearGradient>
          </defs>
          <path d="M11 33V15h5.4l15.2 18H37V15h-5.4L16.4 33H11Z" fill="rgba(15,23,42,0.32)" />
          <path d="M13 32V16h4.2l13.6 16H35V16h-4.2L17.2 32H13Z" fill="url(#neurax-core)" />
          <path d="M17 16h4.4L35 32h-4.4L17 16Z" fill="#0F172A" fillOpacity="0.34" />
          <circle cx="36" cy="12" r="3" fill="#FFFFFF" fillOpacity="0.92" />
          <circle cx="12" cy="36" r="2.4" fill="#A7F3D0" fillOpacity="0.95" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.45),transparent_34%)]" />
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
