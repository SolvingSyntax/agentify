import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, tone = "primary", hint }: { label: string; value: string | number; icon: ComponentType<{ className?: string }>; tone?: "primary" | "cyan" | "violet" | "destructive" | "warning"; hint?: string }) {
  const tones = {
    primary: "text-primary bg-primary/10",
    cyan: "text-cyan bg-cyan/10",
    violet: "text-violet bg-violet/10",
    destructive: "text-destructive bg-destructive/10",
    warning: "text-warning bg-warning/10",
  };
  return (
    <div className="panel panel-hover p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tones[tone])}><Icon className="size-4" /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
