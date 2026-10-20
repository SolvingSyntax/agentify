import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => { setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"); }, []);
  const isDark = theme === "dark";
  const toggle = () => { const next: Theme = isDark ? "light" : "dark"; applyTheme(next); setTheme(next); };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={toggle}
      className="relative flex h-9 w-[68px] items-center rounded-full border border-border bg-muted p-1 shadow-inner transition-colors hover:border-primary/50"
    >
      <Sun className={cn("absolute left-2.5 size-3.5 transition-opacity", isDark ? "text-muted-foreground opacity-60" : "opacity-0")} aria-hidden />
      <Moon className={cn("absolute right-2.5 size-3.5 transition-opacity", isDark ? "opacity-0" : "text-muted-foreground opacity-60")} aria-hidden />
      <span
        className={cn(
          "relative z-10 flex size-7 items-center justify-center rounded-full bg-surface text-primary shadow-md ring-1 ring-border transition-transform duration-300 ease-[cubic-bezier(.3,1.4,.5,1)]",
          isDark ? "translate-x-[30px]" : "translate-x-0",
        )}
      >
        {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </span>
    </button>
  );
}
