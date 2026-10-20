import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/common/states";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import { useApi } from "@/hooks/use-api";
import { workflowService, agentService } from "@/lib/api/services";

export const Route = createFileRoute("/workflows/$workflowId")({
  component: EditorPage,
});

const DEFAULT_NEW_WORKFLOW = {
  id: "new",
  name: "Untitled workflow",
  description: "Configure automated agent pipeline",
  nodes: [
    {
      id: "step-1",
      type: "step",
      position: { x: 100, y: 150 },
      data: { label: "Step 1", agent_id: null, inputs: {}, requires_approval: false },
    },
  ],
  edges: [],
};

export function EditorPage() {
  const { workflowId } = useParams({ strict: false }) as { workflowId: string };
  const isNew = workflowId === "new";

  const state = useApi(async () => {
    const agents = await agentService.list().catch(() => []);
    
    // Intercept "new" to bypass API fetch and provide clean draft state
    if (isNew) {
      return { wf: DEFAULT_NEW_WORKFLOW, agents };
    }

    const wf = await workflowService.get(workflowId);
    return { wf, agents };
  }, [workflowId]);

  return (
    <div className="space-y-4 p-6 text-white">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/workflows">
          <ArrowLeft className="size-4 mr-2" /> All workflows
        </Link>
      </Button>

      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error as any} onRetry={state.reload} />
      ) : state.data ? (
        <WorkflowEditor
          key={state.data.wf.id}
          initial={state.data.wf}
          agents={state.data.agents}
        />
      ) : null}
    </div>
  );
}

export default EditorPage;