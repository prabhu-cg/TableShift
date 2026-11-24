import { AppHeader } from "@/components/layout/AppHeader";
import { Workspace } from "@/components/workspace/Workspace";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main" className="flex-1">
        <Workspace />
      </main>
      <footer className="px-(--spacing-gutter) py-8 text-center text-sm text-ink-muted">
        TableShift · V1.1
      </footer>
    </>
  );
}
