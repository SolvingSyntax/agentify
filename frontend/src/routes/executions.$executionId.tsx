import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncBoundary } from "@/components/common/states";
import { ExecutionDetail } from "@/components/executions/ExecutionDetail";
import { Button } from "@/components/ui/button";
import { useExecutionPolling } from "@/hooks/use-execution";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/executions/$executionId")({
  head: () => pageHead("Execution detail", "Step results, logs and errors for a single workflow run."),
  component: ExecutionPage,
});

function ExecutionPage() {
  const { executionId } = Route.useParams();
  const state = useExecutionPolling(executionId);
  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4"><Link to="/executions"><ArrowLeft className="size-4" />All executions</Link></Button>
      <PageHeader eyebrow="Execution" title={state.data?.workflow_name ?? "Execution"} description={executionId} />
      <AsyncBoundary state={state}>{(ex) => <ExecutionDetail ex={ex} onChange={state.reload} />}</AsyncBoundary>
    </>
  );
}
