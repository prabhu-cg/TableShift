"use client";

import Link from "next/link";
import { useState } from "react";
import { Info } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Drawer } from "@/components/ui/Drawer";
import { AboutContent } from "./info-content";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-(--spacing-gutter) py-3">
        <div className="min-w-0">
          <Link href="/" aria-label="TableShift home" className="inline-block">
            <BrandLogo />
          </Link>
          {/* pl-10 aligns the tagline with the wordmark (30px mark + 10px gap) */}
          <p className="mt-1 pl-10 text-xs leading-tight text-text-subtle">Make desktop data work on mobile.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            aria-haspopup="dialog"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
          >
            <Info className="size-4" aria-hidden="true" />
            About
          </button>
          <ThemeToggle />
        </div>
      </div>
      <Drawer
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="About"
        description="What TableShift is, and why it exists."
      >
        <AboutContent />
      </Drawer>
    </header>
  );
}
