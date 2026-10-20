import { ThemeToggle } from "./ThemeToggle";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useCardTilt } from "@/components/common/use-card-tilt";
import { LayoutGrid, Workflow, Bot, ShieldCheck, History, Plug, BarChart3, Settings, Menu, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { AgentifyMark } from "./AgentifyMark";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/workflows", label: "Workflow Builder", icon: Workflow },
  { to: "/agents", label: "AI Agents", icon: Bot },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/executions", label: "Execution History", icon: History },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

type Conn = "checking" | "online" | "offline";

function useBackendStatus(): Conn {
  const [s, setS] = useState<Conn>("checking");
  useEffect(() => {
    let alive = true;
    const check = () =>
      fetch(API_BASE_URL + endpoints.health, { signal: AbortSignal.timeout(5000) })
        .then((r) => alive && setS(r.ok ? "online" : "offline"))
        .catch(() => alive && setS("offline"));
    check();
    const id = setInterval(check, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return s;
}

export function AppShell({ children }: { children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null);
  useCardTilt(shell);
  const pathname = useLocation({ select: (location) => location.pathname });
  const [open, setOpen] = useState(false);
  const conn = useBackendStatus();

  const sidebar = (
    <nav aria-label="Main" className="flex h-full flex-col">
      <div className="sidebar-brand flex items-center gap-3 px-5 py-6">
        <AgentifyMark className="size-8" />
        <div>
          <p className="font-display text-lg font-semibold leading-none">Agentify</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI Workforce OS</p>
        </div>
      </div>
      <ul className="sidebar-track flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === "/" }}
              className="nav-link group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <span className="sidebar-icon flex size-8 shrink-0 items-center justify-center rounded-lg"><Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary group-data-[status=active]:text-primary" /></span>
              <span className="min-w-0 flex-1">{label}</span>
              <span className="sidebar-marker size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="m-3 rounded-lg border border-sidebar-border p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", conn === "online" ? "bg-success" : conn === "offline" ? "bg-destructive" : "bg-muted-foreground pulse-dot")} />
          <span className="font-medium">{conn === "online" ? "Backend online" : conn === "offline" ? "Backend offline" : "Checking backend…"}</span>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground" title={API_BASE_URL}>{API_BASE_URL}</p>
      </div>
    </nav>
  );

  return (
    <div ref={shell} className="relative isolate min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <div className="grid-floor-scene" aria-hidden="true"><div className="grid-floor" /></div>
      <aside className="sticky top-0 hidden h-screen border-r border-sidebar-border bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-sidebar-border bg-sidebar">
            <button className="absolute right-3 top-6 rounded p-1 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/75 px-4 backdrop-blur-xl md:px-8">
          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="rounded p-1 lg:hidden"><Menu className="size-5" /></button>
          <span className="flex items-center gap-2 lg:hidden"><AgentifyMark className="size-6" /><span className="font-display font-semibold">Agentify</span></span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <span className={cn("size-1.5 rounded-full", conn === "online" ? "bg-success" : conn === "offline" ? "bg-destructive" : "bg-muted-foreground pulse-dot")} />
              {conn === "online" ? "Connected" : conn === "offline" ? "Offline" : "Checking"}
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main key={pathname} className="fade-up mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
