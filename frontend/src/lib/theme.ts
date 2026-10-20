export type Theme = "light" | "dark";
export const THEME_KEY = "agentify.theme";

/** Runs before paint to avoid a flash of the wrong theme. Defaults to dark. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.classList.toggle("dark",t!=="light");}catch(e){}})();`;

export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
}
