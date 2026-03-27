---
status: testing
phase: 25-feed
source: [25-01-PLAN.md, 25-02-PLAN.md, 25-03-PLAN.md]
started: 2026-03-27T00:00:00Z
updated: 2026-03-27T00:00:00Z
---

## Current Test

number: 1
name: Feed page loads at /feed
expected: |
  Navigate to /feed. The page renders with a "Feed" heading and a subheading.
  When logged out: subheading shows "✨ Trending".
  When logged in: subheading shows "✨ Personalised for you".
awaiting: user response

## Tests

### 1. Feed page loads at /feed
expected: Navigate to /feed. Page renders "Feed" heading. Subheading shows "✨ Trending" (logged out) or "✨ Personalised for you" (logged in).
result: pass

### 2. Feed shows cards with content
expected: Each card in the feed shows: an idea title (if available), a truncated idea preview, a score badge (e.g. "3.7/5"), a niche pill, like count, comment count, and a time-ago timestamp ("Xh ago" or "Xd ago"). No rank number is visible.
result: pass

### 3. Feed card click navigates to result
expected: Clicking anywhere on a feed card navigates to /history/{id} — the full result page for that idea.
result: pass

### 4. Author link on feed card
expected: If the validation has an author username, it shows "@username" as a clickable link that goes to /profile/{username}. Clicking the author link does NOT navigate to the result page (propagation is stopped). If no username: shows "Anonymous".
result: [pending]

### 5. Logged-out CTA banner
expected: When NOT logged in, a banner appears on the feed page with text "Sign in to personalise your feed based on the niches you validate in" and a Sign In button. When logged in, this banner is NOT visible.
result: [pending]

### 6. NavBar Feed link + active styling
expected: NavBar shows "Feed" as the first nav link (before Leaderboard). When on /feed, the Feed link is highlighted in red/accent colour. When on /leaderboard, the Leaderboard link is highlighted. Other pages similarly highlight their link.
result: [pending]

### 7. Leaderboard cards show title
expected: On the /leaderboard page, each card now shows the idea title (in heading font) above the idea preview text. The preview text is slightly dimmed as secondary.
result: [pending]

### 8. Infinite scroll loads more
expected: Scroll to the bottom of the feed. If there are more than 20 entries, new cards load automatically without a button press.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

[none yet]
