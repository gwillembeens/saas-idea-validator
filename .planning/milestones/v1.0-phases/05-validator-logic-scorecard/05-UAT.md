---
status: testing
phase: 05-validator-logic-scorecard
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md]
started: 2026-03-21T21:05:00Z
updated: 2026-03-21T21:05:00Z
---

## Current Test

number: 1
name: parseScores utility — extracts scores from markdown
expected: |
  Open the browser dev console at http://localhost:5173. Paste and run this snippet:
    import('/src/utils/parseResult.js').then(m => {
      const md = `| 1. Market & Niche | 4/5 | 30% |\n| 2. Content & Distribution | 3/5 | 25% |\n| 3. Product & Agent Architecture | 4/5 | 35% |\n| 4. Pricing & Moat | 3/5 | 10% |`;
      console.log(m.parseScores(md));
    });
  Expected output: { phase1: 4, phase2: 3, phase3: 4, phase4: 3, weighted: 3.7 }
awaiting: user response

## Tests

### 1. parseScores utility — extracts scores from markdown
expected: Open the browser dev console at http://localhost:5173. Paste and run this snippet:
  import('/src/utils/parseResult.js').then(m => {
    const md = `| 1. Market & Niche | 4/5 | 30% |\n| 2. Content & Distribution | 3/5 | 25% |\n| 3. Product & Agent Architecture | 4/5 | 35% |\n| 4. Pricing & Moat | 3/5 | 10% |`;
    console.log(m.parseScores(md));
  });
  Expected output: { phase1: 4, phase2: 3, phase3: 4, phase4: 3, weighted: 3.7 }
result: [pending]

### 2. parseScores returns null on bad input
expected: In the browser console, run:
  import('/src/utils/parseResult.js').then(m => console.log(m.parseScores("no scorecard here")));
  Expected output: null
result: [pending]

### 3. Scorecard component renders 4 phase rows with ScoreBar
expected: Scorecard.jsx exists at client/src/components/validator/Scorecard.jsx and contains 4 phase rows labelled "1. Market & Niche", "2. Content & Distribution", "3. Product & Agent Architecture", "4. Pricing & Moat" each paired with a ScoreBar, plus a "Weighted Total" footer. (Component not yet wired to App.jsx — visual test comes in Phase 6.)
result: [pending]

### 4. VerdictBadge maps scores to colored verdict tiers
expected: VerdictBadge.jsx exists at client/src/components/validator/VerdictBadge.jsx and contains the 4 verdict tiers: 4.5+ → "Strong Signal" (green #d1fae5), 3.5+ → "Promising" (yellow #fef9c3), 2.5+ → "Needs Work" (orange #ffedd5), below → "Too Vague" (red #fee2e2). Rendered with wobbly border-radius and rotate(-1deg). (Visual test in Phase 6.)
result: [pending]

### 5. Arrow and Squiggle SVGs are hidden on mobile
expected: Both client/src/components/decorative/Arrow.jsx and Squiggle.jsx use className="hidden md:block" — they only appear at the md: (768px+) Tailwind breakpoint, invisible on mobile. (Visual test in Phase 6 when rendered in layout.)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
