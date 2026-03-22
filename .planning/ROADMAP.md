# Roadmap: SaaS Idea Validator

## Milestones

- ✅ **v1.0 MVP** — Phases 1–14 (shipped 2026-03-22)
- 🔜 **v2.0 Social Layer** — Phases 15–25 (roadmap created 2026-03-22)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–14) — SHIPPED 2026-03-22</summary>

- [x] Phase 1: Project Scaffold (1/1 plans) — completed 2026-03-21
- [x] Phase 2: Backend Express Server (2/2 plans) — completed 2026-03-21
- [x] Phase 3: Redux Store & Streaming Hook (2/2 plans) — completed 2026-03-21
- [x] Phase 4: Frontend Components & Design System (3/3 plans) — completed 2026-03-21
- [x] Phase 5: Validator Logic & Scorecard (2/2 plans) — completed 2026-03-21
- [x] Phase 6: Responsive Layout & Polish (2/2 plans) — completed 2026-03-21
- [x] Phase 7: Integration Testing & Deployment Ready (2/2 plans) — completed 2026-03-21
- [x] Phase 8: Results Layout Redesign — Option A Split Cards (2/2 plans) — completed 2026-03-21
- [x] Phase 9: Authentication System (3/3 plans) — completed 2026-03-21
- [x] Phase 10: Saved Ideas — Persist & Browse History (4/4 plans) — completed 2026-03-22
- [x] Phase 11: UI Polish — NavBar, HistoryPage, Loading States (4/4 plans) — completed 2026-03-22
- [x] Phase 12: History Detail View (plans) — completed 2026-03-22
- [x] Phase 13: Framework Page (2/2 plans) — completed 2026-03-22
- [x] Phase 14: Improve Code on ResultPage (3/3 plans) — completed 2026-03-22

See archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Scaffold | v1.0 | 1/1 | Complete | 2026-03-21 |
| 2. Backend Express Server | v1.0 | 2/2 | Complete | 2026-03-21 |
| 3. Redux Store & Streaming Hook | v1.0 | 2/2 | Complete | 2026-03-21 |
| 4. Frontend Components & Design System | v1.0 | 3/3 | Complete | 2026-03-21 |
| 5. Validator Logic & Scorecard | v1.0 | 2/2 | Complete | 2026-03-21 |
| 6. Responsive Layout & Polish | v1.0 | 2/2 | Complete | 2026-03-21 |
| 7. Integration Testing & Deployment Ready | v1.0 | 2/2 | Complete | 2026-03-21 |
| 8. Results Layout Redesign — Split Cards | v1.0 | 2/2 | Complete | 2026-03-21 |
| 9. Authentication System | v1.0 | 3/3 | Complete | 2026-03-21 |
| 10. Saved Ideas — Persist & Browse History | v1.0 | 4/4 | Complete | 2026-03-22 |
| 11. UI Polish | v1.0 | 4/4 | Complete | 2026-03-22 |
| 12. History Detail View | v1.0 | — | Complete | 2026-03-22 |
| 13. Framework Page | v1.0 | 2/2 | Complete | 2026-03-22 |
| 14. Improve Code on ResultPage | v1.0 | 3/3 | Complete | 2026-03-22 |

---

---

<details>
<summary>🔜 v2.0 Social Layer (Phases 15–21) — IN PLANNING</summary>

## Phase Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 15 | Tech Debt Resolution | Wire password reset frontend and write split-card E2E tests | Complete    | 2026-03-22 |
| 16 | Niche Auto-Detection | Implement secondary Claude call to auto-detect 7-value niche taxonomy | NICHE-01, NICHE-02, NICHE-03 | Complete ✓ 2026-03-22 |
| 17 | Publish & Privacy | Add public/private toggle and publishing controls | Complete    | 2026-03-22 |
| 18 | Public Leaderboard | Build ranked leaderboard by score, filterable by niche | Complete    | 2026-03-22 |
| 19 | Idea Versioning | Implement similarity detection and revision chains with score delta | VER-01, VER-02, VER-03, VER-04 | Pending |
| 20 | User Profiles | Create public profile pages with stats, badges, and display names | PROF-01, PROF-02, PROF-03, PROF-04, PROF-05 | Pending |
| 21 | Challenge Cards | Add "Beat the Leaderboard" challenge cards to leaderboard UI | CHAL-01, CHAL-02 | Pending |

## Phase Details

### Phase 15: Tech Debt Resolution
**Goal:** Clear password reset frontend wiring and establish E2E test coverage for split-card results layout.

**Requirements:** DEBT-01, DEBT-02

**Status:** Complete ✓ (Plan 15-01 ✓, Plan 15-02 ✓)

**Plan 15-01 Complete (2026-03-22):**
- ✅ Added `resetPassword(token, newPassword)` to useAuth hook
- ✅ Implemented reset mode UI in AuthModal with password confirmation validation
- ✅ Verified App.jsx correctly handles reset token from URL query parameter
- ✅ User can click reset link, submit new password, and log in with updated credentials

**Plan 15-02 Complete (2026-03-22):**
- ✅ Configured Playwright at project root (playwright.config.js)
- ✅ Created test suite with 8 tests for split-card layout validation (tests/e2e/split-cards.spec.js)
- ✅ Added npm scripts for running tests (test:e2e, test:e2e:ui, test:e2e:debug)
- ✅ Documented testing process and troubleshooting (tests/e2e/README.md)
- ✅ All 8 tests passing; exit code 0

**Success Criteria:**
1. ✅ User can submit password reset request; backend sends reset email (DEBT-01 Complete)
2. ✅ User can click reset link in email and set new password; login succeeds (DEBT-01 Complete)
3. ✅ E2E tests cover split-card layout visibility, component rendering, and font validation (DEBT-02 Complete)
4. ✅ All 8 tests pass; exit code 0; npm run test:e2e succeeds (DEBT-02 Complete)

---

### Phase 16: Niche Auto-Detection
**Goal:** Implement secondary Claude API call that classifies each validation into one of 7 fixed niche categories; persist niche to database and display on result and history pages.

**Requirements:** NICHE-01, NICHE-02, NICHE-03

**Status:** Complete ✓ (Plan 16-01 Complete ✓, Plan 16-02 Complete ✓)

**Plan 16-01 Complete (2026-03-22):**
- ✅ Implemented `parseNiche()` utility with case-insensitive matching for 7 niches
- ✅ Added `generateNiche()` async function with max_tokens=10 constraint
- ✅ DB migration: `niche VARCHAR(50) DEFAULT 'Other'` column added to `saved_results`
- ✅ Wired niche generation into `saveResultRoute` (fires alongside title generation)
- ✅ Updated `listHistoryRoute` and `getResultRoute` to return niche field
- ✅ All tests passing: 13/13 (5 unit tests for parseNiche, 1 integration test)

**Plan 16-02 Complete (2026-03-22):**
- ✅ Added standalone niche pill on ResultPage between IdeaSummaryCard and Scorecard
- ✅ Added niche pill to HistoryCard footer row (after verdict pill, hidden on mobile)
- ✅ Conditional renders: `{result?.niche && ...}` and `{item.niche && ...}`
- ✅ Styling: muted bg (#e5e0d8), pencil border, wobbly border-radius, font-body text-xs
- ✅ Test suite: 5 new unit tests (2 ResultPage, 3 HistoryCard) all passing
- ✅ Full test coverage: 12/12 tests passing, exit 0

**Success Criteria:**
1. ✅ After validation completes, system makes automatic secondary Claude call with idea + result text (max_tokens=10) requesting niche from [Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other]
2. ✅ Parsed niche value is stored in PostgreSQL `saved_results.niche` column; defaults to 'Other' on parse failure
3. ✅ Niche tag is rendered as a coloured pill on the result page and history cards with consistent styling (Plan 16-02)
4. ✅ User can see niche tag on all their historical entries (Plan 16-02)

---

### Phase 17: Publish & Privacy
**Goal:** Add public/private toggle on result page and unpublish action on history page; enforce visibility rules on backend.

**Requirements:** PUB-01, PUB-02, PUB-03

**Success Criteria:**
1. Result page displays a "Make Public / Make Private" toggle button; default state is private on creation
2. User can toggle a validation public/private; state persists to database
3. History page shows a "Unpublish" button on each public validation; clicking confirms and sets to private
4. Backend filters — leaderboard queries only return public validations; private validations only visible to their owner
5. Public share links continue to work for private validations (existing owner-gated behaviour)

---

### Phase 18: Public Leaderboard
**Goal:** Build a dedicated leaderboard page showing all public validations ranked by weighted score, with niche filtering, and entry-level navigation to result pages and user profiles.

**Requirements:** LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05

**Status:** Complete ✓ (Plan 18-01 Complete ✓, Plan 18-02 Complete ✓)

**Plan 18-01 Complete (2026-03-22):**
- ✅ DB migration: `username VARCHAR(50) UNIQUE` column added to `users` table (backward compatible)
- ✅ Created `leaderboardRoute()` handler with pagination (20 items/page), niche filtering, and weighted score sorting
- ✅ Entry shape includes: id, idea_text (≤150 chars), scores, niche, user_id, author_username (nullable), created_at
- ✅ Response envelope: `{ entries, total, page, hasMore }`
- ✅ Route registered: `GET /api/leaderboard` with optional auth, accepts ?niche= and ?page= query params
- ✅ Exports `VALID_NICHES` (8 niches) and `truncateIdeaText()` helper
- ✅ All tests passing: 7/7 (VALID_NICHES: 3, truncateIdeaText: 4)
- ✅ Requirements coverage: LEAD-01 ✓ LEAD-02 ✓ LEAD-03 ✓ LEAD-04 ✓ LEAD-05 ✓

**Plan 18-02 Complete (2026-03-22):**
- ✅ Created `useLeaderboard()` hook with infinite scroll, niche filtering, and URL param state management
- ✅ Created `LeaderboardCard` component rendering idea preview, score badge, author link, niche pill, "You" badge
- ✅ Created `LeaderboardPage` with title, CTA banner (unauthenticated), niche filter pill row, card list, infinite scroll
- ✅ Updated `NavBar` with always-visible Leaderboard link (logged out: Leaderboard | Framework | Sign In; logged in: Leaderboard | Framework | History | Sign Out)
- ✅ Added `/leaderboard` route in App.jsx
- ✅ Test suite: 31/31 tests passing (9 LeaderboardCard, 6 LeaderboardPage, 4 useLeaderboard, 12 other)
- ✅ Requirements coverage: LEAD-01 ✓ LEAD-02 ✓ LEAD-03 ✓ LEAD-04 ✓ LEAD-05 ✓

**Success Criteria:**
1. ✅ `/leaderboard` route renders a page with all public validations sorted by weighted score descending (LEAD-01)
2. ✅ Niche filter pill row allows user to show only validations tagged with a specific niche; "All" shows unfiltered list (LEAD-02)
3. ✅ Each leaderboard entry card displays: idea preview (~150 chars truncated), weighted score, author name (link if set), and niche tag (LEAD-03)
4. ✅ Clicking an entry card navigates to the full public result page (`/history/:id`) (LEAD-04)
5. ✅ Clicking an author name navigates to the user's profile page (`/profile/:username`); Anonymous entries have no link (LEAD-05)

---

### Phase 19: Idea Versioning
**Goal:** Detect when a new validation is ≥75% similar to a prior validation and prompt user to confirm a revision link; show per-phase score delta on result page and version chain on profile.

**Requirements:** VER-01, VER-02, VER-03, VER-04

**Success Criteria:**
1. After validation completes, system compares new idea text to user's past ideas using string similarity (cmpstr algorithm, ≥75% threshold); if match found, displays revision-link modal with original idea title
2. User can confirm ("Link as revision") or dismiss ("New idea") the revision prompt
3. If confirmed, result page shows score delta per phase: "Phase 1: 3.5 → 4.0 (+0.5)" alongside the current phase score
4. Profile page displays revision chains — grouped validations showing original → revision history in chronological order with per-phase deltas

---

### Phase 20: User Profiles
**Goal:** Create public-facing user profile pages showing display name, username, public validations, stats, and revision chains with initials-based avatar fallback.

**Requirements:** PROF-01, PROF-02, PROF-03, PROF-04, PROF-05

**Success Criteria:**
1. Route `/profile/:username` renders public profile page (accessible without login); 404 if username not found
2. User can set a unique display name and username from `/settings`; username is immutable once set; display name can be edited
3. Profile displays user's public validations grid, total count, average score, top niche by frequency, and highest single score achieved
4. Revision chains are shown with clear parent→child visual hierarchy and per-phase score deltas highlighted
5. Avatar renders as initials-based badge (first letter of display name) with fallback styling; no image upload in v2.0

---

### Phase 21: Challenge Cards
**Goal:** Add "Beat the Leaderboard" challenge cards to the leaderboard page showing the highest score achieved per niche, with a CTA to validate an idea in that niche.

**Requirements:** CHAL-01, CHAL-02

**Success Criteria:**
1. Leaderboard page displays a "Beat the Leaderboard" section at the top with challenge cards — one per niche (7 total), showing niche name + top score achieved; idea text is hidden
2. Each challenge card includes a "Try This Niche" CTA button that navigates to `/validate` with a pre-filled niche context hint
3. Card styling matches the hand-drawn design system (wobbly borders, hard shadows, Patrick Hand font)
4. Challenge section is hidden if user is already in the top 1 position for all niches (optional polish for power users)

---

### Phase 22: Profile Analytics
**Goal:** Enhance user profile pages with an expanded stats section and an activity heatmap showing validation activity over time.

**Requirements:** PROF-06, PROF-07

**Success Criteria:**
1. Profile displays an expanded stats section: streak (active days), most-improved revision (largest score delta), score distribution histogram (how many 1s, 2s, 3s, 4s, 5s)
2. Profile displays a GitHub-style activity heatmap grid showing validation frequency by week; styled to match the sketchbook design system (wobbly cell borders, pencil/muted palette)
3. Both sections are hidden when the user has no public validations
4. Stats and heatmap data are returned from the existing `/api/profile/:username` route (no new endpoints needed)

---

## Traceability

All v2.0 requirements mapped:

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | Phase 15 | Complete ✓ |
| DEBT-02 | Phase 15 | Complete ✓ |
| NICHE-01 | Phase 16 | Complete ✓ (Plan 16-01) |
| NICHE-02 | Phase 16 | Complete ✓ (Plan 16-01) |
| NICHE-03 | Phase 16 | Complete ✓ (Plan 16-02) |
| PUB-01 | Phase 17 | Pending |
| PUB-02 | Phase 17 | Pending |
| PUB-03 | Phase 17 | Pending |
| LEAD-01 | Phase 18 | Complete ✓ (Plan 18-01, Plan 18-02) |
| LEAD-02 | Phase 18 | Complete ✓ (Plan 18-01, Plan 18-02) |
| LEAD-03 | Phase 18 | Complete ✓ (Plan 18-01, Plan 18-02) |
| LEAD-04 | Phase 18 | Complete ✓ (Plan 18-01, Plan 18-02) |
| LEAD-05 | Phase 18 | Complete ✓ (Plan 18-01, Plan 18-02) |
| VER-01 | Phase 19 | Pending |
| VER-02 | Phase 19 | Pending |
| VER-03 | Phase 19 | Pending |
| VER-04 | Phase 19 | Pending |
| PROF-01 | Phase 20 | Pending |
| PROF-02 | Phase 20 | Pending |
| PROF-03 | Phase 20 | Pending |
| PROF-04 | Phase 20 | Pending |
| PROF-05 | Phase 20 | Pending |
| CHAL-01 | Phase 21 | Pending |
| CHAL-02 | Phase 21 | Pending |

**Coverage:** 24/24 requirements mapped ✓

</details>

### Phase 23: Social Interactions
**Goal:** Add the ability to like and comment on public ideas. Public validations are shown on the profile page so visitors can browse what a user has shared.

**Requirements:** SOC-01, SOC-02, SOC-03

**Success Criteria:**
1. Logged-in users can like any public validation; like count is visible to everyone; users can un-like
2. Logged-in users can post a comment on any public validation; comments are shown chronologically below the result
3. Public profile page shows the user's public validations (idea preview, score, niche, like count) so visitors can browse their work
4. Anonymous visitors can see likes and comments but cannot interact (read-only)

---

### Phase 24: Notifications
**Goal:** Notify users when social activity happens on their validations — likes, comments, and other in-app events (scope to be refined during planning).

**Requirements:** NOTIF-01, NOTIF-02

**Success Criteria:**
1. Users receive an in-app notification when someone likes one of their public validations
2. Users receive an in-app notification when someone comments on one of their public validations
3. Unread notification count is visible in the NavBar (badge on avatar or bell icon)
4. Notifications page or dropdown lists recent events with links to the relevant validation
5. Users can mark notifications as read; read notifications are visually distinct

---

### Phase 25: Feed
**Goal:** A personalised feed page that surfaces public validations using a ranking algorithm — distinct from the static score-sorted leaderboard, optimised for discovery and engagement.

**Requirements:** FEED-01, FEED-02, FEED-03

**Success Criteria:**
1. `/feed` route renders a scrollable feed of public validations ranked by an engagement algorithm (recency + likes + comments + niche affinity based on user's own validation history)
2. Feed is paginated / infinite-scroll; new items load as user scrolls
3. Each feed card shows: idea preview, score, niche, author (linked), like count, comment count, time ago
4. Logged-out users see a generic feed (no personalisation); logged-in users get a personalised ranking
5. Feed is accessible from the NavBar; visually distinct from the leaderboard (different card layout or sort label)

---

*Roadmap updated: 2026-03-22 after v1.0 milestone*
*Phases: 14 | All complete | Plans total: 35 | Completed: 35*

*v2.0 Social Layer roadmap created: 2026-03-22*
*Phases: 15-21 | Phase 15 complete ✓, Phase 16 complete ✓, Phase 17 complete ✓, Phase 18 complete ✓ | Requirements: 24 | Completed: 16/24*
*Updated: 2026-03-22 after Phase 18-02 completion (public leaderboard fully implemented and tested)*
