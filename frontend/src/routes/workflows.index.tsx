import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Workflow as WorkflowIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status";
import { useApi } from "@/hooks/use-api";
import { workflowService } from "@/lib/api/services";

export const Route = createFileRoute('/workflows/')({
  component: WorkflowsIndexPage,
});

export function WorkflowsIndexPage() {
  const state = useApi(() => workflowService.list());

  const rawData = state.data;
  const workflows = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.items)
    ? (rawData as any).items
    : [];

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Build, configure, and execute automated agent workflows
          </p>
        </div>
        <Button asChild>
          <Link to={"/workflows/new" as any} className="flex items-center gap-2">
            <Plus className="size-4" /> Create Workflow
          </Link>
        </Button>
      </div>

      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error as any} onRetry={state.reload} />
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-surface/30">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
            <WorkflowIcon className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No workflows found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            You haven't created any agent workflows yet. Get started by creating your first pipeline.
          </p>
          <Button asChild variant="outline">
            <Link to={"/workflows/new" as any} className="flex items-center gap-2">
              <Plus className="size-4" /> Create Workflow
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf: any) => (
            <div
              key={wf?.id || Math.random()}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base text-white truncate">
                    {wf?.name || "Untitled Workflow"}
                  </h3>
                  {wf?.status && <StatusBadge status={wf.status} />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {wf?.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                <span>{Array.isArray(wf?.nodes) ? wf.nodes.length : 0} Steps</span>
                <Button variant="ghost" size="sm" asChild className="gap-1 hover:text-primary">
                  <Link
                    to={"/workflows/$workflowId" as any}
                    params={{ workflowId: wf?.id || "" } as any}
                  >
                    Open Editor <ArrowRight className="size-3" />
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

export default WorkflowsIndexPage;