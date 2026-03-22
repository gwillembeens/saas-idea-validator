# Roadmap: SaaS Idea Validator

## Milestones

- ✅ **v1.0 MVP** — Phases 1–14 (shipped 2026-03-22)
- 🔜 **v2.0 Social Layer** — Phases 15–21 (roadmap created 2026-03-22)

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
| 15 | Tech Debt Resolution | Wire password reset frontend and write split-card E2E tests | DEBT-01, DEBT-02 | Complete ✓ |
| 16 | Niche Auto-Detection | Implement secondary Claude call to auto-detect 7-value niche taxonomy | NICHE-01, NICHE-02, NICHE-03 | Pending |
| 17 | Publish & Privacy | Add public/private toggle and publishing controls | PUB-01, PUB-02, PUB-03 | Pending |
| 18 | Public Leaderboard | Build ranked leaderboard by score, filterable by niche | LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05 | Pending |
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

**Success Criteria:**
1. After validation completes, system makes automatic secondary Claude call with idea + result text (max_tokens=10) requesting niche from [Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other]
2. Parsed niche value is stored in PostgreSQL `validations.niche` column; defaults to 'Other' on parse failure
3. Niche tag is rendered as a coloured pill on the result page and history cards with consistent styling
4. User can see niche tag on all their historical entries

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

**Success Criteria:**
1. `/leaderboard` route renders a page with all public validations sorted by weighted score descending
2. Niche filter dropdown allows user to show only validations tagged with a specific niche; "All" shows unfiltered list
3. Each leaderboard entry card displays: idea preview (~150 chars truncated), weighted score, author name, author avatar, and niche tag
4. Clicking an entry card navigates to the full public result page (`/results/:id`)
5. Clicking an author name/avatar navigates to the user's profile page (`/profile/:username`)

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

## Traceability

All v2.0 requirements mapped:

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | Phase 15 | Complete ✓ |
| DEBT-02 | Phase 15 | Complete ✓ |
| NICHE-01 | Phase 16 | Pending |
| NICHE-02 | Phase 16 | Pending |
| NICHE-03 | Phase 16 | Pending |
| PUB-01 | Phase 17 | Pending |
| PUB-02 | Phase 17 | Pending |
| PUB-03 | Phase 17 | Pending |
| LEAD-01 | Phase 18 | Pending |
| LEAD-02 | Phase 18 | Pending |
| LEAD-03 | Phase 18 | Pending |
| LEAD-04 | Phase 18 | Pending |
| LEAD-05 | Phase 18 | Pending |
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

---

*Roadmap updated: 2026-03-22 after v1.0 milestone*
*Phases: 14 | All complete | Plans total: 35 | Completed: 35*

*v2.0 Social Layer roadmap created: 2026-03-22*
*Phases: 15-21 | Phase 15 now complete ✓ | Requirements: 24 | Coverage: 100%*
*Updated: 2026-03-22 after Phase 15 completion (tech debt resolved)*
