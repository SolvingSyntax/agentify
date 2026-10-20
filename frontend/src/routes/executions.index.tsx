import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, RefreshCw, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status";
import { useApi, useMutation } from "@/hooks/use-api";
import { executionService } from "@/lib/api/services";

export const Route = createFileRoute("/executions/")({
  component: ExecutionsIndexPage,
});

export function ExecutionsIndexPage() {
  const state = useApi(async () => {
    try {
      return await executionService.list();
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404) {
        return [];
      }
      throw err;
    }
  });

  const rawData = state.data;
  const executions = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.items)
    ? (rawData as any).items
    : [];

  const retryMutation = useMutation(
    (id: string) => executionService.retry(id),
    { success: "Execution retried", onSuccess: () => state.reload() }
  );

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Execution History</h1>
          <p className="text-sm text-muted-foreground">
            Track real-time workflow runs, logs, and execution statuses
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => state.reload()} disabled={state.loading}>
          <RefreshCw className={`size-4 mr-2 ${state.loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error as any} onRetry={state.reload} />
      ) : executions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-surface/30">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
            <Activity className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No execution history</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Run a workflow from the Workflow Builder to start tracking execution history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {executions.map((ex: any) => (
            <div
              key={ex?.id || Math.random()}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {ex?.workflow_name || ex?.name || "Workflow Execution"}
                  </span>
                  {ex?.status && <StatusBadge status={ex.status} />}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {ex?.id || "N/A"} • Started: {ex?.created_at ? new Date(ex.created_at).toLocaleString() : "Recently"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {ex?.status === "failed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryMutation.run(ex.id)}
                    disabled={retryMutation.pending}
                  >
                    <Play className="size-3.5 mr-1" /> Retry
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild className="gap-1 hover:text-primary">
                  <Link
                    to={"/executions/$executionId" as any}
                    params={{ executionId: ex?.id || "" } as any}
                  >
                    Details <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExecutionsIndexPage;