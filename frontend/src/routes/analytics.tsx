import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Activity, Workflow, Bot, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import { analyticsService } from "@/lib/api/services";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

export function AnalyticsPage() {
  const state = useApi(() => analyticsService.getOverview());

  const data = state.data || {
    totalWorkflows: 0,
    totalExecutions: 0,
    successRate: 100,
    activeAgents: 0,
  };

  const statCards = [
    {
      title: "Total Workflows",
      value: data.totalWorkflows ?? 0,
      icon: Workflow,
      description: "Configured automation pipelines",
    },
    {
      title: "Total Executions",
      value: data.totalExecutions ?? 0,
      icon: Activity,
      description: "Runs completed across all nodes",
    },
    {
      title: "Success Rate",
      value: `${data.successRate ?? 100}%`,
      icon: CheckCircle2,
      description: "Successful vs failed step completion",
    },
    {
      title: "Active Agents",
      value: data.activeAgents ?? 0,
      icon: Bot,
      description: "AI agents currently assigned",
    },
  ];

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Monitor system-wide agent workforce performance and execution metrics
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
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-surface/30">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
              <BarChart3 className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Detailed chart insights</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Execution timeline charts will visualize live performance metrics as workflows are triggered.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;