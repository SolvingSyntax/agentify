import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  succeeded: "text-success border-success/30 bg-success/10",
  connected: "text-success border-success/30 bg-success/10",
  active: "text-success border-success/30 bg-success/10",
  approved: "text-success border-success/30 bg-success/10",
  low: "text-success border-success/30 bg-success/10",
  running: "text-cyan border-cyan/30 bg-cyan/10",
  queued: "text-muted-foreground border-border bg-muted",
  awaiting_approval: "text-warning border-warning/30 bg-warning/10",
  pending: "text-warning border-warning/30 bg-warning/10",
  medium: "text-warning border-warning/30 bg-warning/10",
  failed: "text-destructive border-destructive/30 bg-destructive/10",
  error: "text-destructive border-destructive/30 bg-destructive/10",
  rejected: "text-destructive border-destructive/30 bg-destructive/10",
  high: "text-destructive border-destructive/30 bg-destructive/10",
  cancelled: "text-muted-foreground border-border bg-muted",
  inactive: "text-muted-foreground border-border bg-muted",
  disconnected: "text-muted-foreground border-border bg-muted",
  unconfigured: "text-violet border-violet/30 bg-violet/10",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize", tone[status] ?? tone["queued"], className)}>
      <span className={cn("size-1.5 rounded-full bg-current", status === "running" && "pulse-dot")} aria-hidden />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
