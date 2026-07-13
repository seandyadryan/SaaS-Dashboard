import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant =
    normalized.includes("success") || normalized.includes("active") || normalized.includes("healthy") || normalized.includes("online")
      ? "success"
      : normalized.includes("warning") || normalized.includes("pending")
        ? "warning"
        : normalized.includes("failed") || normalized.includes("suspended") || normalized.includes("error") || normalized.includes("offline") || normalized.includes("critical")
          ? "danger"
          : "default";

  return <Badge variant={variant}>{status}</Badge>;
}
