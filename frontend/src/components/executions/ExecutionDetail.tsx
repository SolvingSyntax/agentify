import { Ban, RotateCcw, Loader2 } from "lucide-react";
import { StatusBadge, formatDate, formatDuration } from "@/components/common/status";
import { Button } from "@/components/ui/button";
import { useMutation } from "@/hooks/use-api";
import { executionService } from "@/lib/api/services";
import { cn } from "@/lib/utils";
import type { Execution } from "@/types/api";

export function ExecutionDetail({ ex, onChange, compact }: { ex: Execution; onChange: () => void; compact?: boolean }) {
  const cancel = useMutation(() => executionService.cancel(ex.id), { success: "Cancellation confirmed by backend", onSuccess: onChange });
  const retry = useMutation(() => executionService.retry(ex.id), { success: "Retry queued by backend", onSuccess: onChange });
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
        <StatusBadge status={ex.status} />
        <span className="text-muted-foreground">Started <span className="text-foreground">{formatDate(ex.started_at)}</span></span>
        <span className="text-muted-foreground">Duration <span className="font-mono text-foreground">{formatDuration(ex.duration_ms)}</span></span>
        <div className="ml-auto flex gap-2">
          {ex.can_cancel && <Button size="sm" variant="outline" onClick={() => cancel.run()} disabled={cancel.pending}>{cancel.pending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}Cancel</Button>}
          {ex.can_retry && <Button size="sm" variant="outline" onClick={() => retry.run()} disabled={retry.pending}>{retry.pending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}Retry</Button>}
        </div>
      </div>
      {ex.error && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{ex.error}</div>}
      <div className={cn("grid gap-4", !compact && "lg:grid-cols-2")}>
        <section className="panel p-4">
          <h3 className="mb-3 text-sm font-semibold">Steps</h3>
          {ex.steps.length === 0 ? <p className="text-sm text-muted-foreground">No step results reported.</p> : (
            <ol className="space-y-3">
              {ex.steps.map((s) => (
                <li key={s.node_id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{s.label}</span><StatusBadge status={s.status} /></div>
                  {s.output && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">{s.output}</pre>}
                  {s.error && <p className="mt-2 text-xs text-destructive">{s.error}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="panel p-4">
          <h3 className="mb-3 text-sm font-semibold">Logs</h3>
          {ex.logs.length === 0 ? <p className="text-sm text-muted-foreground">No logs reported.</p> : (
            <div className="max-h-96 overflow-auto rounded bg-muted p-3 font-mono text-xs" role="log">
              {ex.logs.map((l, i) => (
                <div key={i} className={cn(l.level === "error" && "text-destructive", l.level === "warning" && "text-warning")}>
                  <span className="text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span> {l.message}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
