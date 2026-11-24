import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { Workspace } from "@/components/workspace/Workspace";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main" className="flex-1">
        <Workspace />
      </main>
      <Footer />
    </>
  );
}
