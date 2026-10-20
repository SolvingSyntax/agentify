# Agentify Frontend ↔ FastAPI Contract

Base URL: `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`).
Types referenced below live in `src/types/api.ts`. Endpoint paths live in `src/lib/api/endpoints.ts`.

Auth: `Authorization: Bearer <access_token>` on every request once issued.
CORS must allow the frontend origin.

## Errors
FastAPI-style `{ "detail": string | [{ msg, loc, type }] }`.

| Status | Frontend behaviour |
|---|---|
| 400 / 422 | Shown as validation message |
| 401 | Session cleared, "session expired" |
| 403 | Permission denied state |
| 404 | Not found state |
| 405 / 501 | "Not available on backend yet" state |
| 5xx | Generic server error + retry |
| network / >15s | "Backend not reachable" / timeout + retry |

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| GET | /health | — | 200 any |
| POST | /auth/login | LoginRequest | LoginResponse |
| POST | /auth/logout | — | 204 |
| GET | /auth/me | — | User |
| GET | /dashboard/summary | — | DashboardSummary |
| GET | /agents | — | Agent[] |
| POST | /agents | AgentInput | Agent |
| GET/PATCH/DELETE | /agents/{id} | Partial<AgentInput> (PATCH) | Agent / 204 |
| POST | /agents/{id}/activate · /deactivate | — | Agent |
| POST | /agents/{id}/test | `{ input: string }` | AgentTestResult |
| GET | /agents/{id}/executions | — | ExecutionSummary[] |
| GET | /workflows | — | Workflow[] |
| POST | /workflows | WorkflowInput | Workflow |
| GET/PUT/DELETE | /workflows/{id} | WorkflowInput (PUT) | Workflow / 204 |
| POST | /workflows/{id}/duplicate | — | Workflow |
| POST | /workflows/{id}/validate | — | ValidationResult |
| POST | /workflows/{id}/run | `{ test: boolean }` | ExecutionSummary |
| GET | /executions?status&search&page&page_size | — | Paginated<ExecutionSummary> |
| GET | /executions/{id} | — | Execution (polled every 2s while queued/running/awaiting_approval) |
| POST | /executions/{id}/cancel | — | Execution (only shown when `can_cancel`) |
| POST | /executions/{id}/retry | — | ExecutionSummary (only shown when `can_retry`) |
| GET | /approvals?status=pending | — | Approval[] |
| POST | /approvals/{id}/approve · /reject | `{ note?: string }` | Approval |
| GET | /analytics/overview?range=7d\|30d\|90d | — | AnalyticsOverview |
| GET | /integrations | — | Integration[] |
| POST | /integrations/{key}/connect | `{ config: Record<string,string> }` | Integration |
| POST | /integrations/{key}/disconnect · /test | — | Integration |
| GET/PUT | /settings/workspace | WorkspaceSettings | WorkspaceSettings |
| GET/PUT | /settings/profile | ProfileSettings | ProfileSettings |
| GET/PUT | /settings/ai | `{ default_provider, default_model }` | AISettings |
| GET/PUT | /settings/security | SecuritySettings | SecuritySettings |

## Not yet wired in UI
- Sign-in screen and route protection: the client already sends the bearer token and handles 401; a login page will be added once `/auth/login` exists.
