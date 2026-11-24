"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
// Prerender uses the constant; the browser swaps in the real year after hydration.
const SERVER_YEAR = 2026;

export function CurrentYear() {
  const year = useSyncExternalStore(noopSubscribe, () => new Date().getFullYear(), () => SERVER_YEAR);
  return <>{year}</>;
}
