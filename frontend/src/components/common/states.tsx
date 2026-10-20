import type { ReactNode } from "react";
import { AlertTriangle, PlugZap, RefreshCw, Construction, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/client";

export function LoadingState({ rows = 3 }: { rows?: number | undefined }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full bg-muted" />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const map = {
    network: { icon: PlugZap, title: "Backend not reachable", body: `Agentify can't connect to ${API_BASE_URL}. Start the FastAPI server or check VITE_API_BASE_URL.` },
    timeout: { icon: PlugZap, title: "Request timed out", body: error.message },
    not_implemented: { icon: Construction, title: "Not available yet", body: "This backend endpoint hasn't been implemented. See API_CONTRACT.md." },
    not_found: { icon: Construction, title: "Endpoint or item not found", body: error.message || "The backend returned 404 for this request." },
    unauthorized: { icon: Lock, title: "Sign in required", body: error.message },
    forbidden: { icon: Lock, title: "Permission denied", body: error.message },
  } as const;
  const v = map[error.kind as keyof typeof map] ?? { icon: AlertTriangle, title: "Something went wrong", body: error.message };
  const Icon = v.icon;
  return (
    <div role="alert" className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">{v.title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{v.body}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="size-4" /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel grid-backdrop flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Renders loading / error / content for a useApi result. */
export function AsyncBoundary<T>({ state, children, rows }: { state: { data: T | undefined; error: ApiError | null; loading: boolean; reload: () => void }; children: (data: T) => ReactNode; rows?: number | undefined }) {
  if (state.loading && state.data === undefined) return <LoadingState rows={rows} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data === undefined) return null;
  return <>{children(state.data)}</>;
}
