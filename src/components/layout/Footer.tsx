import { BrandLogo } from "@/components/brand/BrandLogo";
import { CurrentYear } from "./CurrentYear";
import { InfoDrawer } from "./InfoDrawer";
import { AboutContent, PrivacyContent, TermsContent } from "./info-content";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-6xl px-(--spacing-gutter) py-6">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
          <div className="flex justify-center sm:justify-start">
            <BrandLogo size="sm" />
          </div>

          <p className="justify-self-center text-center text-xs text-text-muted">
            &copy; <CurrentYear /> TableShift. Make
            desktop data work on mobile.
          </p>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-5 text-xs text-text-muted sm:justify-self-end"
          >
            <InfoDrawer label="About" title="About" description="What TableShift is, and why it exists.">
              <AboutContent />
            </InfoDrawer>
            <InfoDrawer label="Privacy" title="Privacy" description="How TableShift handles your screenshots.">
              <PrivacyContent />
            </InfoDrawer>
            <InfoDrawer label="Terms" title="Terms" description="The short version.">
              <TermsContent />
            </InfoDrawer>
            <a
              href="https://github.com/prabhu-cg/TableShift"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm transition-colors duration-150 hover:text-text"
            >
              GitHub
            </a>
          </nav>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Your screenshot is sent to an AI provider only when you start an analysis. It isn&rsquo;t stored.
        </p>
      </div>
    </footer>
  );
}
