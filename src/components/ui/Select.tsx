import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

/** Native select (keeps platform pickers and keyboard behaviour) with a themed, inset chevron. */
export function Select({
  className = "",
  dense = false,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { dense?: boolean }) {
  return (
    <div className="relative">
      <select
        className={`${dense ? "min-h-10" : "min-h-11"} w-full appearance-none rounded-xl border border-control bg-surface py-0 pl-3 pr-10 text-sm text-text transition-colors duration-150 hover:bg-surface-muted ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
    </div>
  );
}
