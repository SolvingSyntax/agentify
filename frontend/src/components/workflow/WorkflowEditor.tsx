import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  Handle, Position, ReactFlowProvider, type Node, type Edge, type Connection, type NodeProps, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Bot, Plus, Save, Play, FlaskConical, ShieldCheck, Trash2, Loader2, CheckCircle2, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/status";
import { ErrorState, LoadingState } from "@/components/common/states";
import { ExecutionDetail } from "@/components/executions/ExecutionDetail";
import { useMutation } from "@/hooks/use-api";
import { useExecutionPolling } from "@/hooks/use-execution";
import { workflowService } from "@/lib/api/services";
import { validateWorkflowGraph } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { Agent, ExecutionStatus, Workflow, WorkflowNode, WorkflowNodeConfig } from "@/types/api";

type StepData = WorkflowNodeConfig & Record<string, unknown> & { agentName?: string; runStatus?: ExecutionStatus };
type StepNode = Node<StepData, "step">;

function formatErrorMessage(e: unknown): string {
  if (!e) return "An unknown error occurred";
  if (typeof e === "string") return e;

  const apiErr = e as { response?: { data?: { detail?: unknown }; status?: number }; message?: string };
  const detail = apiErr?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const loc = Array.isArray((item as any).loc)
            ? (item as any).loc.filter((x: any) => x !== "body").join(".")
            : "";
          const msg = (item as any).msg || (item as any).message || JSON.stringify(item);
          return loc ? `${loc}: ${msg}` : msg;
        }
        return String(item);
      })
      .join(", ");
  }

  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") return JSON.stringify(detail);

  return apiErr?.message || (e instanceof Error ? e.message : "Failed to process workflow");
}

function StepNodeView({ data, selected }: NodeProps<StepNode>) {
  return (
    <div className={cn("w-56 rounded-xl border bg-surface-raised p-3 shadow-lg transition-colors", selected ? "border-primary" : "border-border", data?.runStatus === "running" && "border-cyan")}>
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Bot className="size-4" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{data?.label || "Untitled Step"}</p>
          <p className={cn("truncate text-xs", data?.agentName ? "text-muted-foreground" : "text-warning")}>{data?.agentName ?? "No agent assigned"}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {data?.requires_approval && <span className="flex items-center gap-1 text-[10px] text-warning"><ShieldCheck className="size-3" />Approval</span>}
        {data?.runStatus && <StatusBadge status={data.runStatus} className="ml-auto" />}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { step: StepNodeView };

export default function WorkflowEditor({ initial, agents = [] }: { initial: Workflow; agents: Agent[] }) {
  const navigate = useNavigate();
  const agentName = useMemo(() => new Map((agents || []).map((a) => [a.id, a.name])), [agents]);
  const [name, setName] = useState(initial?.name ?? "Untitled workflow");
  const [description, setDescription] = useState(initial?.description ?? "");

  // Guaranteed position sanitization on initial nodes
  const initialNodes = useMemo<StepNode[]>(() => {
    const rawNodes = Array.isArray(initial?.nodes) ? initial.nodes : [];
    return rawNodes.filter(Boolean).map((n, idx) => ({
      id: String(n?.id || `step-${idx}`),
      type: "step",
      position: {
        x: typeof n?.position?.x === "number" && !isNaN(n.position.x) ? n.position.x : 80 + idx * 280,
        y: typeof n?.position?.y === "number" && !isNaN(n.position.y) ? n.position.y : 120 + (idx % 2) * 80,
      },
      data: (n?.data || {}) as StepData,
    }));
  }, [initial]);

  const initialEdges = useMemo<Edge[]>(() => {
    const rawEdges = Array.isArray(initial?.edges) ? initial.edges : [];
    return rawEdges.filter(Boolean).map((e, idx) => ({
      id: String(e?.id || `e-${e?.source}-${e?.target}` || `edge-${idx}`),
      source: String(e?.source || ""),
      target: String(e?.target || ""),
      animated: false,
    })).filter((e) => e.source && e.target);
  }, [initial]);

  const [nodes, setNodes, onNodesChange] = useNodesState<StepNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const exec = useExecutionPolling(executionId);

  const runStatus = useMemo(() => new Map((exec.data as any)?.steps?.map((s: any) => [s.node_id, s.status]) ?? []), [exec.data]);

  const viewNodes = useMemo(() => {
    return nodes.filter(Boolean).map((n, idx) => ({
      ...n,
      id: String(n?.id || `step-${idx}`),
      type: "step",
      position: {
        x: typeof n?.position?.x === "number" && !isNaN(n.position.x) ? n.position.x : 80 + idx * 280,
        y: typeof n?.position?.y === "number" && !isNaN(n.position.y) ? n.position.y : 120,
      },
      data: {
        ...(n?.data || {}),
        agentName: n?.data?.agent_id ? agentName.get(n.data.agent_id) : undefined,
        runStatus: runStatus.get(n?.id),
      },
    }));
  }, [nodes, agentName, runStatus]);

  const viewEdges = useMemo(() => {
    return edges.filter(Boolean).map((e, idx) => ({
      ...e,
      id: String(e?.id || `e-${e?.source}-${e?.target}` || `edge-${idx}`),
      source: String(e?.source || ""),
      target: String(e?.target || ""),
      animated: Boolean(runStatus.get(e?.source) === "succeeded" && runStatus.get(e?.target) === "running"),
    })).filter((e) => e.source && e.target);
  }, [edges, runStatus]);

  const toDefinition = useCallback(() => ({
    name: name.trim() || "Untitled workflow",
    description: description || "",
    nodes: nodes.filter(Boolean).map((n, idx) => ({
      id: String(n.id || `step-${idx}`),
      name: n.data?.label || "Step",
      type: "step",
      position: {
        x: typeof n.position?.x === "number" && !isNaN(n.position.x) ? n.position.x : 80 + idx * 280,
        y: typeof n.position?.y === "number" && !isNaN(n.position.y) ? n.position.y : 120,
      },
      data: {
        label: n.data?.label || "Step",
        agent_id: n.data?.agent_id || null,
        inputs: n.data?.inputs || {},
        requires_approval: Boolean(n.data?.requires_approval),
        ...(typeof n.data?.timeout_seconds === "number" && !isNaN(n.data.timeout_seconds)
          ? { timeout_seconds: n.data.timeout_seconds }
          : {}),
      },
    })),
    edges: edges.filter(Boolean).map((e, idx) => ({
      id: String(e.id || `e-${e.source}-${e.target}` || `edge-${idx}`),
      source: String(e.source),
      target: String(e.target),
    })),
  }), [name, description, nodes, edges]);

  const save = useMutation(
    async () => {
      const payload = toDefinition();
      try {
        return await workflowService.update(initial.id, payload);
      } catch (err: any) {
        const status = err?.response?.status || err?.status;
        if (status === 404 && typeof (workflowService as any).create === "function") {
          const created = await (workflowService as any).create(payload);
          toast.success("Workflow created and saved");
          navigate({
            to: "/workflows/$workflowId" as any,
            params: { workflowId: created.id } as any,
          });
          return created;
        }
        toast.error(formatErrorMessage(err));
        throw err;
      }
    },
    {
      success: "Workflow saved",
      onSuccess: () => setDirty(false),
    }
  );

  const dup = useMutation(
    async () => {
      try {
        return await workflowService.duplicate(initial.id);
      } catch (err: unknown) {
        toast.error(formatErrorMessage(err));
        throw err;
      }
    },
    {
      success: "Duplicated",
      onSuccess: (w) => navigate({ to: "/workflows/$workflowId" as any, params: { workflowId: w.id } as any }),
    }
  );

  const validate = useCallback(async (): Promise<boolean> => {
    const def = toDefinition();
    const local = validateWorkflowGraph(def.nodes as any, def.edges);
    if (local.length) {
      setIssues(local);
      toast.error(local.join(", "));
      return false;
    }
    
    const ok = await save.run();
    if (!ok) return false;

    try {
      const res = await workflowService.validate(initial.id);
      const errMsgs = (res?.errors || []).map((e: unknown) =>
        typeof e === "string" ? e : (e as any)?.message || JSON.stringify(e)
      );
      setIssues(errMsgs);
      if (res?.valid) {
        toast.success("Backend validation passed");
      } else if (errMsgs.length > 0) {
        toast.error(errMsgs.join(", "));
      }
      return Boolean(res?.valid);
    } catch (e: unknown) {
      const msg = formatErrorMessage(e);
      toast.error(msg);
      setIssues([msg]);
      return false;
    }
  }, [toDefinition, save, initial.id]);

  const run = useMutation(
    async (test: boolean) => {
      if (!(await validate())) throw new Error("Fix validation issues before running.");
      try {
        return await workflowService.run(initial.id, test);
      } catch (err: unknown) {
        toast.error(formatErrorMessage(err));
        throw err;
      }
    },
    {
      success: (e) => `Execution ${e.status} (backend)`,
      onSuccess: (e) => setExecutionId(e.id),
    }
  );

  const onConnect = useCallback((c: Connection) => { setEdges((es) => addEdge({ ...c, id: `e-${c.source}-${c.target}` }, es)); setDirty(true); }, [setEdges]);
  const addStep = () => {
    const id = `step-${crypto.randomUUID().slice(0, 8)}`;
    setNodes((ns) => [...ns, { id, type: "step", position: { x: 80 + ns.length * 280, y: 120 + (ns.length % 2) * 80 }, data: { label: `Step ${ns.length + 1}`, agent_id: null, inputs: {}, requires_approval: false } }]);
    setSelectedId(id);
    setDirty(true);
  };
  const updateSelected = (patch: Partial<WorkflowNodeConfig>) => { setNodes((ns) => ns.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n))); setDirty(true); };
  const removeSelected = () => { setNodes((ns) => ns.filter((n) => n.id !== selectedId)); setEdges((es) => es.filter((e) => e.source !== selectedId && e.target !== selectedId)); setSelectedId(null); setDirty(true); };
  const selected = nodes.find((n) => n.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Cleaned Top Header Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            aria-label="Workflow name"
            className="h-10 max-w-xs border-transparent bg-transparent font-display text-xl font-bold hover:border-border focus:border-border"
          />
          {dirty && (
            <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning border border-warning/20">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Canvas Actions Group */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button variant="ghost" size="sm" onClick={addStep} className="h-8 gap-1.5 px-2.5 text-xs">
              <Plus className="size-3.5" /> Add step
            </Button>
            <div className="h-4 w-[1px] bg-border" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dup.run()}
              disabled={dup.pending}
              title="Duplicate Workflow"
              className="size-8"
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => validate()}
              title="Validate Workflow"
              className="size-8"
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          </div>

          {/* Primary Save & Run Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => save.run()}
            disabled={save.pending || !dirty}
            className="h-9 gap-1.5 px-3 text-xs"
          >
            {save.pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => run.run(true)}
            disabled={run.pending}
            className="h-9 gap-1.5 px-3 text-xs"
          >
            <FlaskConical className="size-3.5" /> Test
          </Button>

          <Button
            size="sm"
            onClick={() => run.run(false)}
            disabled={run.pending}
            className="h-9 gap-1.5 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {run.pending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Run
          </Button>
        </div>
      </div>

      {issues.length > 0 && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <ul className="list-inside list-disc space-y-0.5 text-warning">{issues.map((i, k) => <li key={k}>{i}</li>)}</ul>
          <button onClick={() => setIssues([])} aria-label="Dismiss"><X className="size-4" /></button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="panel grid-backdrop relative h-[560px] overflow-hidden">
          {viewNodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center">
              <p className="font-display text-lg">Empty canvas</p>
              <p className="text-sm text-muted-foreground">Use "Add step" and drag between handles to connect steps.</p>
            </div>
          )}
          <ReactFlowProvider>
            <ReactFlow
              nodes={viewNodes} edges={viewEdges} nodeTypes={nodeTypes}
              onNodesChange={(c) => { onNodesChange(c as never); if (c.some((x) => x.type === "position" || x.type === "remove")) setDirty(true); }}
              onEdgesChange={(c) => { onEdgesChange(c); if (c.some((x) => x.type === "remove")) setDirty(true); }}
              onConnect={onConnect}
              onNodeClick={(_, n) => setSelectedId(n.id)}
              onPaneClick={() => setSelectedId(null)}
              fitView proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--muted-foreground)" />
              <Controls />
              <MiniMap pannable zoomable nodeColor="var(--primary)" maskColor="oklch(0 0 0 / 50%)" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <aside className="panel p-4" aria-label="Step configuration">
          {!selected ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Workflow details</h2>
              <Label htmlFor="wf-desc">Description</Label>
              <Textarea id="wf-desc" rows={4} value={description} onChange={(e) => { setDescription(e.target.value); setDirty(true); }} placeholder="What does this workflow automate?" />
              <p className="text-xs text-muted-foreground">Select a step on the canvas to configure it.</p>
              {(!agents || agents.length === 0) && <p className="text-xs text-warning">No agents exist yet — create one on the AI Agents page first.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Configure step</h2><Button variant="ghost" size="icon" aria-label="Delete step" onClick={removeSelected}><Trash2 className="size-4" /></Button></div>
              <div className="space-y-1.5"><Label htmlFor="s-label">Label</Label><Input id="s-label" value={selected.data?.label || ""} onChange={(e) => updateSelected({ label: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label htmlFor="s-agent">Agent</Label>
                <select id="s-agent" className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm" value={selected.data?.agent_id ?? ""} onChange={(e) => updateSelected({ agent_id: e.target.value || null })}>
                  <option value="">Select an agent…</option>
                  {(agents || []).map((a) => {
                    const isInactive = Boolean(a?.status && a.status !== "active");
                    return (
                      <option key={a.id} value={a.id} disabled={isInactive}>
                        {a.name || "Unnamed Agent"}{isInactive ? ` (${a.status})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-inputs">Inputs (one key=value per line)</Label>
                <Textarea id="s-inputs" rows={4} className="font-mono text-xs" value={Object.entries(selected.data?.inputs || {}).map(([k, v]) => `${k}=${v}`).join("\n")}
                  onChange={(e) => updateSelected({ inputs: Object.fromEntries(e.target.value.split("\n").map((l) => l.split("=")).filter((p) => p[0]?.trim()).map(([k, ...v]) => [(k ?? "").trim(), v.join("=")])) })} placeholder={"prompt={{previous.output}}"} />
              </div>
              <div className="space-y-1.5"><Label htmlFor="s-timeout">Timeout (seconds)</Label><Input id="s-timeout" type="number" min={1} value={selected.data?.timeout_seconds ?? ""} onChange={(e) => updateSelected({ timeout_seconds: e.target.value ? Number(e.target.value) : undefined })} /></div>
              <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"><span>Require human approval</span><Switch checked={Boolean(selected.data?.requires_approval)} onCheckedChange={(c) => updateSelected({ requires_approval: c })} /></label>
            </div>
          )}
        </aside>
      </div>

      {executionId && (
        <section aria-live="polite">
          <h2 className="mb-3 text-base font-semibold">Live execution</h2>
          {exec.error ? (
            <ErrorState error={exec.error as any} onRetry={exec.reload} />
          ) : !exec.data ? (
            <LoadingState rows={1} />
          ) : (
            <ExecutionDetail ex={exec.data as any} onChange={exec.reload} />
          )}
        </section>
      )}
    </div>
  );
}