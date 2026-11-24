import type { TableAnalysis } from "@/types/analysis";
import type { Recommendation } from "@/types/recommendation";

/** Every pattern renderer takes the same props: structured data in, an actual responsive interface out. */
export interface MobileLayoutRendererProps {
  analysis: TableAnalysis;
  recommendation: Recommendation;
  /** The actual CSS width of the simulated screen. Visual scaling is handled outside the renderer. */
  viewportWidth: number;
}
