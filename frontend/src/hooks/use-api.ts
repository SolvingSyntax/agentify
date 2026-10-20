import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Universal error formatter for FastAPI and Axios API error responses.
 */
export function formatApiError(error: any): string {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === "string") return error;

  const detail = error?.response?.data?.detail ?? error?.data?.detail ?? error?.message;

  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        if (typeof err === "string") return err;
        if (typeof err === "object" && err !== null) {
          const field = Array.isArray(err.loc)
            ? err.loc.filter((l: any) => l !== "body").join(".")
            : "";
          const msg = err.msg || err.message || JSON.stringify(err);
          return field ? `${field}: ${msg}` : msg;
        }
        return String(err);
      })
      .join(" | ");
  }

  if (typeof detail === "object" && detail !== null) {
    return JSON.stringify(detail);
  }

  return detail ? String(detail) : "An unexpected error occurred.";
}

/**
 * Custom data-fetching hook used across routes.
 */
export function useApi<TData>(
  fetchFn: (...args: any[]) => Promise<TData>,
  deps: any[] = []
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown | null>(null);

  const reload = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
      setData(res);
      return res;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export interface UseMutationOptions<TData> {
  success?: string | ((data: TData) => string);
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData> = {}
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const run = useCallback(
    async (variables: TVariables): Promise<TData | boolean> => {
      setPending(true);
      setError(null);
      try {
        const data = await mutationFn(variables);
        if (options.success) {
          const msg =
            typeof options.success === "function"
              ? options.success(data)
              : options.success;
          toast.success(msg);
        }
        options.onSuccess?.(data);
        return data;
      } catch (err: any) {
        const readableMsg = formatApiError(err);
        setError(err);
        toast.error(readableMsg);
        options.onError?.(err);
        return false;
      } finally {
        setPending(false);
      }
    },
    [mutationFn, options]
  );

  return { run, pending, error };
}