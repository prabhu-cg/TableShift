import type { PatternId } from "@/types/recommendation";
import { CardLayoutPreview } from "./CardLayoutPreview";
import { ColumnPickerPreview } from "./ColumnPickerPreview";
import { ExpandableTablePreview } from "./ExpandableTablePreview";
import { GroupedSectionsPreview } from "./GroupedSectionsPreview";
import { HorizontalTablePreview } from "./HorizontalTablePreview";
import { ListDetailPreview } from "./ListDetailPreview";
import { PrioritisedListPreview } from "./PrioritisedListPreview";
import { RecordPagerPreview } from "./RecordPagerPreview";
import { EmptyPreview } from "./shared";
import { SummarySheetPreview } from "./SummarySheetPreview";
import { TabbedGroupsPreview } from "./TabbedGroupsPreview";
import type { MobileLayoutRendererProps } from "./types";

const RENDERERS: Record<PatternId, (p: MobileLayoutRendererProps) => React.ReactNode> = {
  card: (p) => <CardLayoutPreview {...p} />,
  "expandable-rows": (p) => <ExpandableTablePreview {...p} />,
  "horizontal-scroll": (p) => <HorizontalTablePreview {...p} />,
  "prioritised-columns": (p) => <PrioritisedListPreview {...p} />,
  "list-detail": (p) => <ListDetailPreview {...p} />,
  "column-picker": (p) => <ColumnPickerPreview {...p} />,
  "grouped-sections": (p) => <GroupedSectionsPreview {...p} />,
  "tabbed-groups": (p) => <TabbedGroupsPreview {...p} />,
  "summary-sheet": (p) => <SummarySheetPreview {...p} />,
  "record-pager": (p) => <RecordPagerPreview {...p} />,
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
