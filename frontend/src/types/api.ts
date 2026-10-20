export type ID = string;
export type ISODate = string;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface User {
  id: ID;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "member" | "viewer";
}
export interface LoginRequest { email: string; password: string }
export interface LoginResponse { access_token: string; token_type: "bearer"; user: User }

export type ExecutionStatus = "queued" | "running" | "awaiting_approval" | "succeeded" | "failed" | "cancelled";
export type AgentStatus = "active" | "inactive" | "error";

export interface DashboardSummary {
  workflows_total: number;
  agents_total: number;
  agents_active: number;
  executions_succeeded: number;
  executions_failed: number;
  executions_running: number;
  pending_approvals: number;
  recent_executions: ExecutionSummary[];
  agent_workload: { agent_id: ID; agent_name: string; status: AgentStatus; running: number; completed_24h: number }[];
  usage_timeseries: { date: string; succeeded: number; failed: number }[];
}

export interface Agent {
  id: ID;
  name: string;
  description: string;
  instructions: string;
  provider: string;
  model: string;
  tools: string[];
  status: AgentStatus;
  health?: { last_check_at: ISODate | null; ok: boolean; message?: string };
  created_at: ISODate;
  updated_at: ISODate;
}
export type AgentInput = Pick<Agent, "name" | "description" | "instructions" | "provider" | "model" | "tools">;
export interface AgentTestResult { output: string; latency_ms: number; tokens_used?: number }

export interface WorkflowNodeConfig {
  label: string;
  agent_id: ID | null;
  inputs: Record<string, string>;
  requires_approval: boolean;
  timeout_seconds?: number | undefined;
}
export interface WorkflowNode { id: string; position: { x: number; y: number }; data: WorkflowNodeConfig }
export interface WorkflowEdge { id: string; source: string; target: string }
export interface Workflow {
  id: ID;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: ISODate;
  updated_at: ISODate;
}
export type WorkflowInput = Pick<Workflow, "name" | "description" | "nodes" | "edges">;
export interface ValidationResult { valid: boolean; errors: { node_id?: string; message: string }[] }

export interface StepResult {
  node_id: string;
  label: string;
  status: ExecutionStatus;
  started_at: ISODate | null;
  finished_at: ISODate | null;
  output?: string | null;
  error?: string | null;
}
export interface ExecutionSummary {
  id: ID;
  workflow_id: ID;
  workflow_name: string;
  status: ExecutionStatus;
  is_test: boolean;
  started_at: ISODate;
  finished_at: ISODate | null;
  duration_ms: number | null;
}
export interface Execution extends ExecutionSummary {
  steps: StepResult[];
  logs: { timestamp: ISODate; level: "info" | "warning" | "error"; message: string }[];
  error?: string | null;
  can_cancel: boolean;
  can_retry: boolean;
}
export interface ExecutionFilters { status?: ExecutionStatus | ""; search?: string; page?: number; page_size?: number }

export interface Approval {
  id: ID;
  execution_id: ID;
  workflow_name: string;
  step_label: string;
  action_summary: string;
  details: Record<string, unknown>;
  risk_level: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";
  requested_at: ISODate;
}

export interface AnalyticsOverview {
  success_rate: number | null;
  avg_duration_ms: number | null;
  total_executions: number;
  failure_trend: { date: string; failed: number; total: number }[];
  duration_trend: { date: string; avg_ms: number }[];
  model_usage: { model: string; calls: number; tokens: number }[];
}

export type IntegrationStatus = "connected" | "disconnected" | "failed" | "unconfigured";
export interface Integration {
  key: string;
  name: string;
  category: "ai_provider" | "email" | "spreadsheet" | "social";
  status: IntegrationStatus;
  status_message?: string | null;
  last_verified_at: ISODate | null;
  config_fields: { name: string; label: string; type: "text" | "password" | "url" | "number"; required: boolean }[];
}

export interface WorkspaceSettings { name: string; timezone: string; default_approval_required: boolean }
export interface ProfileSettings { full_name: string; email: string }
export interface AISettings { default_provider: string; default_model: string; available: { provider: string; models: string[] }[] }
export interface SecuritySettings { mfa_enabled: boolean; session_timeout_minutes: number }
