import { useEffect, type RefObject } from "react";

/** Delegate to real cards only; touch and reduced-motion users get static cards. */
export function useCardTilt(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let active: HTMLElement | null = null;
    const reset = () => {
      active?.style.removeProperty("--tilt-x");
      active?.style.removeProperty("--tilt-y");
      active?.classList.remove("card-tilting");
      active = null;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        reset();
        return;
      }
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".panel-hover") : null;
      if (active !== card) reset();
      if (!card) return;
      active = card;
      const rect = card.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      card.style.setProperty("--tilt-x", `${-y * 4}deg`);
      card.style.setProperty("--tilt-y", `${x * 4}deg`);
      card.classList.add("card-tilting");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    return () => {
      reset();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
    };
  }, [root]);
}