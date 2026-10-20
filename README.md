# Agentify — AI Workforce Automation

Agentify is the control room for an AI workforce: create agents, compose them into
workflows, review the steps that need a human sign-off, and watch every run.

The interface talks to a FastAPI backend over a documented REST API and holds no
sample data of its own — every screen shows real records, or an explicit empty,
loading, or error state.

## Screens

| Route | What it does |
| --- | --- |
| `/` | Dashboard: runs, approvals, agent and cost totals |
| `/agents` | Agent list, create/edit, test run, enable or disable, delete |
| `/workflows` | Workflow builder: drag steps, connect them, set inputs and approvals |
| `/approvals` | Pending human sign-offs with approve / reject and a note |
| `/runs` | Execution history with search, filters and pagination |
| `/integrations` | Connect and verify third-party services |
| `/analytics` | Usage, cost and success trends over 7, 30 or 90 days |
| `/settings` | Workspace, notification and model preferences |

## Backend contract

All endpoint paths live in `src/lib/api/endpoints.ts`; requests go through
`src/lib/api/client.ts`, which adds the bearer token and turns failures into typed
errors. The full request and response shapes are documented in
[API_CONTRACT.md](API_CONTRACT.md).

Point the app at your API with an environment file at the project root:

```sh
# .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Requests are made with a bearer token from browser storage. Until a login endpoint
is available in the backend, supply a token directly:

```sh
# browser console
localStorage.setItem("agentify.token", "<your access token>")
```

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
npm i
npm run dev
```

Other scripts:

```sh
npm run build      # production build
npm run preview    # serve the production build
npm run lint       # eslint
npm run format     # prettier
npm test           # vitest
```

## Built with

- TanStack Start (file-based routing only)
- TypeScript
- React
- Tailwind CSS
- React Flow for the workflow canvas

## Layout

```
src/
  components/    UI: layout shell, common pieces, workflow editor, shadcn primitives
  hooks/         data loading (useApi) and mutations
  lib/           API client, services, endpoints, theme, formatting
  routes/        one file per page
  styles.css     design tokens, light and dark themes
```
