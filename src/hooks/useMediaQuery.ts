"use client";

import { useSyncExternalStore } from "react";

const DESKTOP = "(min-width: 1024px)";

/** True at the `lg` breakpoint and above. False during server render and the first hydration pass. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(DESKTOP);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}
