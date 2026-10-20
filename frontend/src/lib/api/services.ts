import { api } from "@/lib/api/client";
// frontend/src/lib/api/services.ts (or services/index.ts)

export interface AnalyticsOverview {
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  activeAgents: number;
}

export const analyticsService = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    // Replace with your project's client call (e.g., apiClient, axios, or fetch)
    const response = await fetch("/api/analytics/overview");
    if (!response.ok) {
      throw new Error("Failed to fetch analytics overview");
    }
    return response.json();
  },
};
export const workflowService = {
  list: async () => {
    const res = await api.get("/workflows");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/workflows/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/workflows", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.put(`/workflows/${id}`, data);
    return res.data;
  },
  duplicate: async (id: string) => {
    const res = await api.post(`/workflows/${id}/duplicate`);
    return res.data;
  },
  validate: async (id: string) => {
    const res = await api.post(`/workflows/${id}/validate`);
    return res.data;
  },
  run: async (id: string, test: boolean = false) => {
    const res = await api.post(`/workflows/${id}/run`, { test });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/workflows/${id}`);
    return res.data;
  },
};

export const agentService = {
  list: async () => {
    const res = await api.get("/agents");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/agents/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/agents", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.put(`/agents/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/agents/${id}`);
    return res.data;
  },
};

export const executionService = {
  list: async () => {
    const res = await api.get("/executions");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/executions/${id}`);
    return res.data;
  },
  retry: async (id: string) => {
    const res = await api.post(`/executions/${id}/retry`);
    return res.data;
  },
  cancel: async (id: string) => {
    const res = await api.post(`/executions/${id}/cancel`);
    return res.data;
  },
};

export const approvalService = {
  list: async () => {
    const res = await api.get("/approvals");
    return res.data;
  },
  approve: async (id: string) => {
    const res = await api.post(`/approvals/${id}/approve`);
    return res.data;
  },
  reject: async (id: string) => {
    const res = await api.post(`/approvals/${id}/reject`);
    return res.data;
  },
};

export const integrationService = {
  list: async () => {
    try {
      const res = await api.get("/integrations");
      return res.data;
    } catch {
      return [];
    }
  },
  update: async (id: string, data: Record<string, any>) => {
    try {
      const res = await api.put(`/integrations/${id}`, data);
      return res.data;
    } catch {
      return { id, ...data };
    }
  },
  toggle: async (id: string, enabled?: boolean) => {
    try {
      const res = await api.post(`/integrations/${id}/toggle`, { enabled });
      return res.data;
    } catch {
      return { id, enabled };
    }
  },
};