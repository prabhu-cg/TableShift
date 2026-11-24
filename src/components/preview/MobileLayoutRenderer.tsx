import type { PatternId } from "@/types/recommendation";
import { CardLayoutPreview } from "./CardLayoutPreview";
import { ExpandableTablePreview } from "./ExpandableTablePreview";
import { HorizontalTablePreview } from "./HorizontalTablePreview";
import { ListDetailPreview } from "./ListDetailPreview";
import { PrioritisedListPreview } from "./PrioritisedListPreview";
import { EmptyPreview } from "./shared";
import type { MobileLayoutRendererProps } from "./types";

const RENDERERS: Record<PatternId, (p: MobileLayoutRendererProps) => React.ReactNode> = {
  card: (p) => <CardLayoutPreview {...p} />,
  "expandable-rows": (p) => <ExpandableTablePreview {...p} />,
  "horizontal-scroll": (p) => <HorizontalTablePreview {...p} />,
  "prioritised-columns": (p) => <PrioritisedListPreview {...p} />,
  "list-detail": (p) => <ListDetailPreview {...p} />,
};

/** Picks the renderer for the recommendation's pattern. Renders from data only; never calls the AI. */
export function MobileLayoutRenderer(props: Partial<MobileLayoutRendererProps>) {
  const { analysis, recommendation, viewportWidth } = props;
  if (!analysis) return <EmptyPreview kind="no-columns" />;
  if (!recommendation) return <EmptyPreview kind="no-recommendation" />;
  const render = RENDERERS[recommendation.patternId];
  if (!render) return <EmptyPreview kind="unsupported" />;
  return <>{render({ analysis, recommendation, viewportWidth: viewportWidth ?? 390 })}</>;
}
