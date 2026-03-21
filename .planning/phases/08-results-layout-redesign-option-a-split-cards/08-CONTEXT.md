---
phase: 8
name: Results layout redesign — Option A split cards
status: context_complete
created: 2026-03-21
---

# Phase 8 Context — Results Layout Redesign (Option A Split Cards)

## Goal

Replace the current single-card ResultsPanel (raw markdown dump) with a structured
layout of discrete visual cards — one per logical section of the Claude response.
Remove the duplicate markdown scorecard table. Use the existing `Scorecard` component
(ScoreBar dots) as the canonical score display.

---

## Decisions

### A — Card layout and order

**Decision:** Option A — linear vertical stack of discrete cards.

Layout (top to bottom):

```
[VerdictBadge pill]          ← centered, top
[Card: Idea Summary]         ← ## 📋 Idea Summary section only
[Card: Scorecard dots]       ← existing Scorecard component (ScoreBar circles)
[Card: Verdict text]         ← own small card between Scorecard and Commentary
[Card: Commentary]           ← ## 📝 Commentary section (all 4 phases)
```

The `## 🔬 Scorecard` markdown table is **stripped entirely** — not rendered anywhere.
The visual ScoreBar dots (existing `Scorecard` component) are the sole score display.

The Verdict text card sits between the Scorecard dots card and the Commentary card.
It renders the `## ✅ Verdict` section content: 2–3 sentence overall take + Top 3 list.

### B — Key question styling

**Decision:** No change. Key question lines (`**Key question for the founder:**`) render
as-is via the existing markdown components — bold text inline with the commentary paragraph.
No special callout box, highlight, or visual treatment.

### C — Streaming UX and card appearance timing

**Decision:** All result cards appear together only when `status === 'done'`. No cards
render during `streaming` state.

Graceful approach:
- While `status === 'loading'`: show the existing skeleton Card (no change)
- While `status === 'streaming'`: show a single "Analysing…" state — a simple progress
  indicator (e.g. animated dots or a subtle pulsing card) so the user knows work is
  happening, but no partial card content is shown
- When `status === 'done'`: reveal all cards simultaneously with a gentle fade-in
  transition (CSS opacity transition, ~300ms) so the appearance feels deliberate, not jarring

---

## Parsing Strategy

Claude's response follows a fixed structure. Each section is delimited by `## ` headings:

| Section heading | Target |
|---|---|
| `## 📋 Idea Summary` | Idea Summary card |
| `## 🔬 Scorecard` | **Stripped** (not rendered) |
| `## 📝 Commentary` | Commentary card |
| `## ✅ Verdict` | Verdict text card |

A `parseSections(markdown)` utility will split the markdown string by `## ` headings and
return a map of `{ ideaSummary, commentary, verdict }` strings. Returns `null` on parse
failure — fallback: render full raw markdown in a single card (existing behavior).

The existing `parseScores(markdown)` utility is unchanged. `Scorecard` still calls it.

---

## Component Structure

New/modified files:

- `client/src/utils/parseSections.js` — new utility, splits markdown into sections
- `client/src/components/validator/ResultsPanel.jsx` — major rewrite
  - Replaces single-card markdown dump with the 5-element layout
  - Handles streaming state with "Analysing…" indicator
  - Handles parse failure graceful fallback
- `client/src/components/validator/IdeaSummaryCard.jsx` — new, renders Idea Summary section
- `client/src/components/validator/VerdictCard.jsx` — new, renders Verdict text section
- `client/src/components/validator/CommentaryCard.jsx` — new, renders Commentary section
- `client/src/components/validator/Scorecard.jsx` — no structural change; used as-is
- `client/src/components/validator/VerdictBadge.jsx` — no change; rendered at top
- `client/src/App.jsx` — updated to remove separate Scorecard/VerdictBadge from layout
  (they are now internal to ResultsPanel's new structure)

---

## Design Constraints

All cards follow existing design system rules:
- Wobbly border-radius (inline style)
- Hard offset shadow (`shadow-hard`)
- Card decoration variants: `tape`, `tack`, `none` — vary per card for visual interest
- Fonts: `font-heading` (Kalam) for headings, `font-body` (Patrick Hand) for body
- Colors: `text-pencil`, `bg-paper`, `bg-muted`, `bg-postit`

Suggested card decorations:
- Idea Summary: `decoration="tape"`, `rotate={-1}`
- Scorecard dots: `decoration="tack"`, `rotate={1}`
- Verdict text: `decoration="none"`, `rotate={0}` (small, clean)
- Commentary: `decoration="tape"`, `rotate={1}`

---

## Out of Scope

- Mobile layout changes beyond existing responsive rules (single column by default)
- Animations beyond the fade-in reveal
- Sharing or PDF export (v2)
- Any new Redux state (no new slice fields needed)

---

## Code Context

Relevant existing files:

| File | Notes |
|---|---|
| `client/src/components/validator/ResultsPanel.jsx` | Major rewrite target |
| `client/src/components/validator/Scorecard.jsx` | Used unchanged |
| `client/src/components/validator/VerdictBadge.jsx` | Used unchanged |
| `client/src/utils/parseResult.js` | `parseScores` — unchanged |
| `client/src/App.jsx` | Remove standalone Scorecard/VerdictBadge; they move inside ResultsPanel |
| `client/src/components/ui/Card.jsx` | Reused for all new cards |

---

*Context captured: 2026-03-21 — discuss-phase 8 complete*
