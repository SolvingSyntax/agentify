import { createFileRoute } from "@tanstack/react-router";
import { Bot, Workflow, Activity, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/states";
import { useApi } from "@/hooks/use-api";
import {
  agentService,
  workflowService,
  executionService,
  approvalService,
} from "@/lib/api/services";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function getResourceCount(res: any): number {
  if (!res) return 0;
  if (Array.isArray(res)) return res.length;
  if (typeof res === "object") {
    if (typeof res.total === "number") return res.total;
    if (typeof res.count === "number") return res.count;
    if (Array.isArray(res.items)) return res.items.length;
    if (Array.isArray(res.data)) return res.data.length;
    if (Array.isArray(res.agents)) return res.agents.length;
    if (Array.isArray(res.workflows)) return res.workflows.length;

    const arrayVal = Object.values(res).find((v) => Array.isArray(v));
    if (arrayVal) return (arrayVal as any[]).length;
  }
  return 0;
}

export function DashboardPage() {
  const state = useApi(async () => {
    const [agentsRes, workflowsRes, executionsRes, approvalsRes] = await Promise.all([
      agentService.list().catch(() => []),
      workflowService.list().catch(() => []),
      executionService.list().catch(() => []),
      approvalService.list().catch(() => []),
    ]);

    console.log("Raw API Payload:", { agentsRes, workflowsRes, executionsRes, approvalsRes });

    return {
      totalAgents: getResourceCount(agentsRes),
      activeWorkflows: getResourceCount(workflowsRes),
      totalExecutions: getResourceCount(executionsRes),
      pendingApprovals: getResourceCount(approvalsRes),
    };
  });

  const stats = state.data || { totalAgents: 0, activeWorkflows: 0, totalExecutions: 0, pendingApprovals: 0 };

  const cards = [
    { title: "Total Agents", value: stats.totalAgents, icon: Bot, color: "text-primary" },
    { title: "Active Workflows", value: stats.activeWorkflows, icon: Workflow, color: "text-emerald-400" },
    { title: "Total Executions", value: stats.totalExecutions, icon: Activity, color: "text-cyan-400" },
    { title: "Pending Approvals", value: stats.pendingApprovals, icon: ShieldCheck, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">OPERATIONS CENTER</span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Live status of your AI workforce, reported by the Agentify backend.</p>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-4xl font-bold tracking-tight ${card.color}`}>{card.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;