import { cn } from "@/lib/utils";

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/15 text-sm font-semibold text-blue-100",
        className,
      )}
    >
      {src ? <img src={src} alt={name} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" /> : initials}
    </div>
  );
}
