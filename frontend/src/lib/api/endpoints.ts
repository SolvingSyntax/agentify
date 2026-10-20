/** All backend endpoint paths, relative to VITE_API_BASE_URL. See API_CONTRACT.md. */
export const endpoints = {
  health: "/health",
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  dashboard: { summary: "/dashboard/summary" },
  agents: {
    list: "/agents",
    one: (id: string) => `/agents/${id}`,
    activate: (id: string) => `/agents/${id}/activate`,
    deactivate: (id: string) => `/agents/${id}/deactivate`,
    test: (id: string) => `/agents/${id}/test`,
    executions: (id: string) => `/agents/${id}/executions`,
  },
  workflows: {
    list: "/workflows",
    one: (id: string) => `/workflows/${id}`,
    duplicate: (id: string) => `/workflows/${id}/duplicate`,
    validate: (id: string) => `/workflows/${id}/validate`,
    run: (id: string) => `/workflows/${id}/run`,
  },
  executions: {
    list: "/executions",
    one: (id: string) => `/executions/${id}`,
    cancel: (id: string) => `/executions/${id}/cancel`,
    retry: (id: string) => `/executions/${id}/retry`,
  },
  approvals: {
    list: "/approvals",
    approve: (id: string) => `/approvals/${id}/approve`,
    reject: (id: string) => `/approvals/${id}/reject`,
  },
  analytics: { overview: "/analytics/overview" },
  integrations: {
    list: "/integrations",
    connect: (key: string) => `/integrations/${key}/connect`,
    disconnect: (key: string) => `/integrations/${key}/disconnect`,
    test: (key: string) => `/integrations/${key}/test`,
  },
  settings: {
    workspace: "/settings/workspace",
    profile: "/settings/profile",
    ai: "/settings/ai",
    security: "/settings/security",
  },
} as const;
