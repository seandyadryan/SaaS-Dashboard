import { useEffect } from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const icons = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: XCircle,
};

const variants = {
  default: "border-slate-700 bg-slate-900",
  success: "border-green-500/30 bg-green-950/80",
  warning: "border-amber-500/30 bg-amber-950/80",
  danger: "border-red-500/30 bg-red-950/80",
};

export function ToastViewport() {
  const { toasts, removeToast } = useUiStore();

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) => window.setTimeout(() => removeToast(toast.id), 3400));
    return () => timers.forEach(window.clearTimeout);
  }, [removeToast, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const variant = toast.variant ?? "default";
        const Icon = icons[variant];
        return (
          <div key={toast.id} className={cn("rounded-xl border p-4 text-white shadow-soft backdrop-blur-xl animate-slide-up", variants[variant])}>
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-slate-300">{toast.description}</p> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
