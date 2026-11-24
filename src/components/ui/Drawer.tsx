"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Right-hand drawer over a scrim. Uses <dialog> for focus trapping and Esc. */
export function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="drawer fixed inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-border bg-surface p-0 text-text shadow-overlay"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 inline-flex shrink-0 items-center justify-center rounded-full p-2 text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-4 px-6 py-5 text-sm leading-relaxed text-text-muted">{children}</div>
    </dialog>
  );
}
