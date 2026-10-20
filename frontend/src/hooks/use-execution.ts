import { useEffect } from "react";
import { useApi } from "./use-api";
import { executionService } from "@/lib/api/services";

const ACTIVE = new Set(["queued", "running", "awaiting_approval"]);

/** Fetch an execution and poll the backend while it is still in progress. */
export function useExecutionPolling(id: string | null, intervalMs = 2000) {
  const state = useApi((s) => (id ? executionService.get(id, s) : Promise.resolve(undefined)), [id]);
  const status = state.data?.status;
  useEffect(() => {
    if (!id || !status || !ACTIVE.has(status) || state.error) return;
    const t = setTimeout(state.reload, intervalMs);
    return () => clearTimeout(t);
  }, [id, status, state.data, state.error, state.reload, intervalMs]);
  return state;
}
