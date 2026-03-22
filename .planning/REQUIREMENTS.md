# Requirements: SaaS Idea Validator

**Defined:** 2026-03-22
**Core Value:** A founder pastes an idea and gets an honest, investor-grade analysis in under a minute, streamed live with a visual scorecard — fast enough to validate 10 ideas in a morning.

## v2.0 Requirements

Requirements for the Social Layer milestone. Each maps to roadmap phases (15+).

### Leaderboard

- [ ] **LEAD-01**: User can view a public leaderboard ranked by weighted score descending
- [ ] **LEAD-02**: User can filter the leaderboard by niche
- [ ] **LEAD-03**: Leaderboard cards show truncated idea preview (~150 chars) + score + author
- [ ] **LEAD-04**: User can click a leaderboard entry to view the full public result page
- [ ] **LEAD-05**: User can click an author name/avatar on a leaderboard card to view their profile

### Niche Detection

- [ ] **NICHE-01**: System auto-detects niche via secondary Claude call after validation completes (max_tokens=10, 7-value fixed taxonomy: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other)
- [ ] **NICHE-02**: Niche is stored in PostgreSQL alongside the validation
- [ ] **NICHE-03**: Niche tag is displayed on the result page and history cards

### Publishing

- [ ] **PUB-01**: User can toggle a validation public or private from the result page (default: private)
- [ ] **PUB-02**: User can unpublish a validation from the history page
- [ ] **PUB-03**: Only public validations appear on the leaderboard; private ones are invisible to other users

### Versioning

- [ ] **VER-01**: System detects when a new idea is ≥75% similar to a past validation and prompts user to confirm it as a revision
- [ ] **VER-02**: User can confirm or dismiss the revision link
- [ ] **VER-03**: Result page shows per-phase score delta (±) when a revision is confirmed
- [ ] **VER-04**: Version chain is visible on the user's profile page

### User Profiles

- [ ] **PROF-01**: User has a public profile page at /profile/:username
- [ ] **PROF-02**: User can set a unique display name and username (username immutable once set)
- [ ] **PROF-03**: Profile shows user's public validations and stats (total count, avg score, top niche, highest score)
- [ ] **PROF-04**: Profile shows revision chains for ideas with multiple versions
- [ ] **PROF-05**: Avatar uses initials-based fallback (no image upload in v2.0)

### Challenge Cards

- [ ] **CHAL-01**: Leaderboard page shows "Beat the Leaderboard" cards — top score per niche (score + niche only, idea text hidden)
- [ ] **CHAL-02**: Challenge cards include a CTA that drives users to the validate flow

### Tech Debt

- [ ] **DEBT-01**: Password reset frontend form wired to existing backend `/api/auth/reset-password` endpoint
- [ ] **DEBT-02**: E2E tests written for split-card results layout

## v3.0 Requirements

Deferred to future release.

### Social

- **SOCL-01**: User can follow other users and see a feed of their public validations
- **SOCL-02**: User can like or bookmark leaderboard entries
- **SOCL-03**: User can leave comments on public validations

### Profiles

- **PROF-06**: User can upload a custom avatar image
- **PROF-07**: User can edit their bio (max 500 chars)

### Leaderboard

- **LEAD-06**: Weekly/monthly leaderboard snapshots with historical rankings
- **LEAD-07**: Personalised challenge cards based on user's own niche history

### Notifications

- **NOTF-01**: User receives notification when they are beaten on the leaderboard
- **NOTF-02**: User receives notification when a revision scores higher than the original

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first; sketchbook design targets desktop |
| Real-time leaderboard updates | Batch refresh (5 min) sufficient; real-time adds infra complexity |
| PDF export | Non-critical for social layer; deferred |
| Paid leaderboard boosts | Gamification without integrity |
| Voting / likes on entries | Social complexity deferred to v3.0 |
| Image avatar upload | Initials fallback sufficient for v2.0 |
| Semantic embedding similarity (Voyage AI) | cmpstr text similarity sufficient for v2.0 MVP; embeddings deferred to v3.0 if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | Phase 15 | Pending |
| DEBT-02 | Phase 15 | Pending |
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

**Coverage:**
- v2.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial v2.0 definition*
