"use client";

import Link from "next/link";
import { useState } from "react";
import { Info } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { InfoPanel } from "@/components/ui/InfoPanel";

export function AppHeader() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-(--spacing-gutter) py-4">
        <div className="flex min-w-0 items-baseline gap-4">
          <Link href="/" aria-label="TableShift home" className="shrink-0">
            <BrandLogo />
          </Link>
          <p className="hidden text-sm text-ink-muted md:block">Make desktop data work on mobile.</p>
        </div>
        <button
          type="button"
          onClick={() => setAboutOpen((o) => !o)}
          aria-expanded={aboutOpen}
          aria-controls="about-panel"
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-muted hover:bg-surface hover:text-ink"
        >
          <Info className="size-4" aria-hidden="true" />
          About
        </button>
      </div>
      {aboutOpen && (
        <div className="mx-auto w-full max-w-5xl px-(--spacing-gutter) pb-5">
          <InfoPanel id="about-panel" title="About TableShift">
            <p>
              TableShift helps product and UX designers find better mobile layouts for existing
              desktop data tables. Paste a screenshot of a table and it suggests the three mobile
              patterns that fit best, with the reasoning.
            </p>
            <p>
              Privacy: a screenshot is sent to the configured external AI provider only when you
              select Analyse screenshot, to read the table structure. TableShift doesn&rsquo;t store
              it or use it for training. The recommendations themselves are calculated by TableShift&rsquo;s
              own rules.
            </p>
          </InfoPanel>
        </div>
      )}
    </header>
  );
}
