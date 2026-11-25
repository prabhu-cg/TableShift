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
  "column-picker": {
    summary: "A compact table where users choose which columns to show, starting from the most important.",
    secondaryLocation: "Behind a Columns button that lists every column as a checkbox.",
    interaction: {
      scrolling: "Vertical page scroll; sideways scroll only if the chosen columns are too wide for the screen.",
      expansion: "A Columns panel opens in place above the table and closes when the user is done.",
      navigation: "None: the picker is a panel, not a new screen.",
      selection: "Checkboxes switch columns on or off. The first column (the record title) always stays.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "The picker button reports aria-expanded and names how many columns are shown.",
      "Keyboard: Tab through the checkboxes; Space toggles a column; Escape or the Done button closes the panel.",
      "Screen readers: put the checkboxes in a labelled group and announce the new column count after a change.",
    ],
    implementation: {
      responsive: "Show four columns by default on a phone and let users add more; remember their choice per table.",
      css: ["Table layout with a pinned first column.", "A panel that pushes the table down instead of overlapping it."],
      challenges: ["Choosing a sensible default column set.", "Saving the user's choice between visits."],
    },
  },
  "grouped-sections": {
    summary: "Records are grouped under collapsible headers, one per value of a column such as status.",
    secondaryLocation: "In the expanded area under each record, or in the section the record belongs to.",
    interaction: {
      scrolling: "Vertical page scroll only.",
      expansion: "Tap a section header to open or close the whole group; the first section starts open.",
      navigation: "None: sections open in place.",
      selection: "Records are not selectable here. Add a tap target if your product opens a record.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "Each section header is a heading containing a button with aria-expanded and aria-controls.",
      "Keyboard: Tab to a header, Enter or Space to open or close it.",
      "Screen readers: the header announces the group name, the record count and its state.",
    ],
    implementation: {
      responsive: "Single column of sections; each record uses the same compact row as the list pattern.",
      css: ["Native details/summary or a button-controlled region.", "Sticky section headers for long groups."],
      challenges: ["Choosing which column to group by.", "Keeping section state when data refreshes."],
    },
  },
  "tabbed-groups": {
    summary: "The table's column groups become tabs; every record keeps its title and shows one group at a time.",
    secondaryLocation: "On the other tabs, one tab per column group.",
    interaction: {
      scrolling: "Vertical page scroll; the tab bar can scroll sideways if there are many groups.",
      expansion: "None: switching tabs swaps the columns for every record at once.",
      navigation: "Tabs change the view in place without leaving the page.",
      selection: "The selected tab stays while the user scrolls and is remembered when they return.",
    },
    accessibility: [
      COMMON_A11Y.readability,
      COMMON_A11Y.touch,
      COMMON_A11Y.contrast,
      "Use role=tablist, tab and tabpanel, with aria-selected and aria-controls set correctly.",
      "Keyboard: Left and Right arrows move between tabs; Tab moves into the panel.",
      "Screen readers: announce each tab's name and position, such as Performance, tab 2 of 3.",
    ],
    implementation: {
      responsive: "A scrollable tab bar on phones; show full tab names, not icons.",
      css: ["Horizontal tab bar with scroll snapping.", "Fixed record title column or heading above each group of values."],
      challenges: ["Columns that belong to no group need a home (a General tab).", "Very long group names need to be shortened."],
    },
  },
};
