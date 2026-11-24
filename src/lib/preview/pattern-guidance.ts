import type { PatternId } from "@/types/recommendation";

/** Static design guidance per pattern. Kept separate from scoring: it explains, it never ranks. */
export interface PatternGuidance {
  /** One-line description shown in comparisons. */
  summary: string;
  /** Where fields that aren't shown up front end up. */
  secondaryLocation: string;
  interaction: { scrolling: string; expansion: string; navigation: string; selection: string };
  accessibility: string[];
  implementation: { responsive: string; css: string[]; challenges: string[] };
}

const COMMON_A11Y = {
  readability: "Use at least 14px body text and keep line height near 1.4 so values stay legible on small screens.",
  touch: "Make every tap target at least 44 × 44 px, with space between neighbouring targets.",
  contrast: "Keep text at 4.5:1 contrast or better. Don't use colour alone to show status.",
};

export const PATTERN_GUIDANCE: Record<PatternId, PatternGuidance> = {
  card: {
    summary: "Each row becomes a self-contained card: identifier as the title, labelled values beneath.",
    secondaryLocation: "In a “More details” disclosure on each card.",
    interaction: {
      scrolling: "Vertical page scroll only; no horizontal scrolling.",
      expansion: "An optional “More details” disclosure holds the fields that don't fit on the card face.",
      navigation: "None needed: the card is the record.",
      selection: "Cards aren't selectable here. Make the card tappable if your product opens a record.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "Label every value; each card is an article titled by its identifier.",
      "Keyboard: Tab reaches each disclosure and action; Enter or Space toggles details.",
      "Screen readers: use a list of articles so the record count and each record's title are announced.",
    ],
    implementation: {
      responsive: "Single column on narrow screens; value pairs sit two-up once the width allows.",
      css: ["CSS grid for the label/value pairs.", "overflow-wrap: anywhere on values so long text never overflows."],
      challenges: ["Page length grows with row count; consider pagination.", "Comparing one field across records is harder than in a table."],
    },
  },
  "expandable-rows": {
    summary: "A compact list where each row expands in place to show the remaining fields.",
    secondaryLocation: "In the expanded area under each row.",
    interaction: {
      scrolling: "Vertical page scroll only.",
      expansion: "Tap a row to expand or collapse it. “Expand all” opens every row.",
      navigation: "None: details open in place.",
      selection: "A row is selected by expanding it; several rows can stay open.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "Each row header is a real button with aria-expanded and aria-controls.",
      "Keyboard: Tab to a row header, Enter or Space to expand; focus stays on the header.",
      "Screen readers: the button announces its state (expanded or collapsed) alongside the record title.",
    ],
    implementation: {
      responsive: "The collapsed row shows the identifier plus two key fields and wraps as needed.",
      css: ["Use the hidden attribute (or grid-template-rows animation) for the collapsed region.", "Keep the whole header tappable, not only the chevron."],
      challenges: ["Row actions can end up hidden behind the expand step.", "Several expanded rows make the list uneven."],
    },
  },
  "horizontal-scroll": {
    summary: "The full table, kept intact, with horizontal scrolling and a pinned first column.",
    secondaryLocation: "Reachable by scrolling right; every column stays in the table.",
    interaction: {
      scrolling: "Scrolls horizontally inside the table; the identifier column stays pinned on the left.",
      expansion: "None.",
      navigation: "None: the page and the table scroll independently.",
      selection: "Rows aren't selectable in this preview.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "Keep real table semantics (th with scope, td) so screen readers can navigate by cell.",
      "Keyboard: make the scroll region focusable and labelled so arrow keys scroll it.",
      "Screen readers: provide a caption and announce that the region scrolls sideways.",
    ],
    implementation: {
      responsive: "Columns keep a minimum width; the table scrolls when it is wider than the screen.",
      css: ["position: sticky; left: 0 on the first column with an opaque background.", "overflow-x: auto on a wrapper, plus a visible cue such as an edge shadow."],
      challenges: ["Off-screen columns are easy to miss.", "Sticky columns need opaque backgrounds to avoid text overlap."],
    },
  },
  "prioritised-columns": {
    summary: "Only the most important columns show in a compact table; the rest sit behind a toggle.",
    secondaryLocation: "Behind “Show secondary details”, grouped under each row.",
    interaction: {
      scrolling: "Vertical page scroll only.",
      expansion: "A single toggle reveals the secondary fields for every row at once.",
      navigation: "None.",
      selection: "Rows aren't selectable in this preview.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "The toggle is a labelled switch; hidden fields are removed from the accessibility tree, not just from view.",
      "Keyboard: the switch is reachable with Tab and toggled with Space.",
      "Screen readers: announce the number of secondary fields the toggle controls.",
    ],
    implementation: {
      responsive: "Choose the priority columns per breakpoint; fewer on narrow screens.",
      css: ["Use a real table for the priority columns.", "Render secondary details in a full-width row with colspan."],
      challenges: ["Depends on a correct choice of which columns matter most.", "Secondary data needs a clear route so it isn't forgotten."],
    },
  },
  "list-detail": {
    summary: "A light list of records; selecting one opens its full detail view.",
    secondaryLocation: "In the record's detail view.",
    interaction: {
      scrolling: "The list scrolls vertically; the detail view is its own screen.",
      expansion: "None: detail opens as a separate view.",
      navigation: "Select a record to open it; “All records” (or Esc) goes back and restores your place.",
      selection: "One record is open at a time.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "Move focus to the detail heading on open, and back to the chosen list item on return.",
      "Keyboard: Enter opens a record; Esc or the back button returns.",
      "Screen readers: give the detail view a heading and a visible, labelled back control.",
    ],
    implementation: {
      responsive: "A single column on phones; wider screens can show list and detail side by side.",
      css: ["Keep list rows at least 44px tall.", "Preserve list scroll position when returning from detail."],
      challenges: ["Highest effort: routing, state and back behaviour.", "Comparing records means moving between detail views."],
    },
  },
};
