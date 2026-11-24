"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui/Drawer";

interface InfoDrawerProps {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** A text-link trigger that opens its content in a drawer (used in the footer). */
export function InfoDrawer({ label, title, description, children }: InfoDrawerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="rounded-sm transition-colors duration-150 hover:text-text"
      >
        {label}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title} description={description}>
        {children}
      </Drawer>
    </>
  );
}
