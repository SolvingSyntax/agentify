import type { AgentInput, WorkflowNode, WorkflowEdge } from "@/types/api";

export type AgentErrors = Partial<Record<keyof AgentInput, string>>;

export function validateAgent(v: AgentInput): AgentErrors {
  const e: AgentErrors = {};
  if (!v.name.trim()) e.name = "Name is required";
  else if (v.name.length > 80) e.name = "Name must be 80 characters or fewer";
  if (!v.instructions.trim()) e.instructions = "Instructions are required";
  if (!v.provider.trim()) e.provider = "Provider is required";
  if (!v.model.trim()) e.model = "Model is required";
  return e;
}

/** Client-side structural check before asking the backend to validate. */
export function validateWorkflowGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const errors: string[] = [];
  if (nodes.length === 0) errors.push("Add at least one step.");
  for (const n of nodes) if (!n.data.agent_id) errors.push(`Step "${n.data.label}" has no agent assigned.`);
  const ids = new Set(nodes.map((n) => n.id));
  for (const e of edges) if (!ids.has(e.source) || !ids.has(e.target)) errors.push("A connection points to a missing step.");
  // cycle detection
  const adj = new Map<string, string[]>();
  edges.forEach((e) => adj.set(e.source, [...(adj.get(e.source) ?? []), e.target]));
  const state = new Map<string, 1 | 2>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const t of adj.get(id) ?? []) if (visit(t)) return true;
    state.set(id, 2);
    return false;
  };
  if (nodes.some((n) => visit(n.id))) errors.push("Workflow contains a cycle; dependencies must flow one way.");
  return errors;
}
