export function AgentifyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-primary/10 stroke-primary/40" />
      <circle cx="16" cy="9" r="3" className="fill-primary" />
      <circle cx="9" cy="22" r="3" className="fill-cyan" />
      <circle cx="23" cy="22" r="3" className="fill-violet" />
      <path d="M16 12 L9 19 M16 12 L23 19 M12 22 H20" className="stroke-foreground/50" strokeWidth="1.4" />
    </svg>
  );
}
