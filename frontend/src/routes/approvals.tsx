import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status";
import { useApi, useMutation } from "@/hooks/use-api";
import { approvalService } from "@/lib/api/services";

export const Route = createFileRoute('/approvals')({
  component: ApprovalsPage,
});

export function ApprovalsPage() {
  const state = useApi(() => approvalService.list());

  // Safe array extraction guard preventing null/undefined crashes
  const rawData = state.data;
  const approvals = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.items)
    ? (rawData as any).items
    : [];

  const approveMutation = useMutation(
    (id: string) => approvalService.approve(id),
    { success: "Approval granted", onSuccess: () => state.reload() }
  );

  const rejectMutation = useMutation(
    (id: string) => approvalService.reject(id),
    { success: "Approval rejected", onSuccess: () => state.reload() }
  );

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve execution steps requiring human intervention
          </p>
        </div>
      </div>

      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error as any} onRetry={state.reload} />
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-surface/30">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No pending approvals</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            All workflow execution steps are up to date or do not require manual approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item: any) => (
            <div
              key={item?.id || Math.random()}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {item?.step_label || item?.workflow_name || "Approval Request"}
                  </span>
                  {item?.status && <StatusBadge status={item.status} />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Execution ID: <code className="font-mono">{item?.execution_id || "N/A"}</code>
                </p>
                {item?.prompt && (
                  <p className="text-sm text-muted-foreground mt-2 bg-surface/50 p-2 rounded border border-border/50">
                    {item.prompt}
                  </p>
                )}
              </div>

              {item?.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => rejectMutation.run(item.id)}
                    disabled={rejectMutation.pending}
                  >
                    <XCircle className="size-4 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.run(item.id)}
                    disabled={approveMutation.pending}
                  >
                    <CheckCircle2 className="size-4 mr-1" /> Approve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalsPage;