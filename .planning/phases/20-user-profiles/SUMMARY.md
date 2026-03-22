---
phase: 20
title: User Profiles
status: complete
completed: "2026-03-22"
plans: [20-01, 20-02, 20-03, 20-04]
commits: [74890d1, 84fc4ed, e87035c, ffb12b2]
---

# Phase 20 — User Profiles: Summary

## What Was Built

User profiles, public profile pages, and a settings page for managing display name and username.

## Key Deliverables

### Backend (20-01)
- **DB migration:** `display_name VARCHAR(100)` added to `users` table
- **`GET /api/profile/:username`** — public route returning user stats, public validations (truncated), and revision chains built from `parent_id` FK
- **`GET /api/me`** — auth-required route returning current user's id, email, username, display_name
- **`PATCH /api/me/settings`** — auth-required route to update display_name and username; username locked after first save (409 on duplicate/locked)
- **13 unit tests** passing: username validation (5), display_name validation (4), chain-building logic (4)

### Frontend Wave 1A (20-02)
- **`Avatar` component** — initials badge, deterministic hash color (6 palette), 64px (`lg`) / 28px (`sm`), wobbly -1deg rotation, hard shadow
- **`setUserProfile` reducer** added to `authSlice` — updates `user.displayName` / `user.username` in Redux without re-login
- **`useAuth.js`** — fetches `/api/me` after session restore to populate `user.displayName` and `user.username`
- **`SettingsPage`** — `/settings` page with display name (always editable) + username (locked with Lock icon after first save, pre-save warning shown)

### Frontend Wave 1B (20-03)
- **`ProfileValidationCard`** — read-only card (no edit/delete) with score badge + niche pill; navigates to `/history/:id` on click
- **`RevisionChains`** — version pills connected by `→`, score deltas (green/red/muted), links to `/history/:id`; hidden when empty
- **`ProfilePage`** — 64px Avatar header, display name + @username, stat row (total validations · avg score · top niche · personal best), 2-col validation grid, revision chains below grid, 404 state with leaderboard link

### Frontend Wave 2 (20-04)
- **NavBar** — adds Settings link + 28px Avatar badge for logged-in users; Avatar only rendered when `user.username` is set; links to `/profile/:username`
- **`App.jsx`** — registers `/profile/:username` → `ProfilePage` and `/settings` → `SettingsPage` routes

## Requirements Covered
- PROF-01 ✓ Public profile page at `/profile/:username`
- PROF-02 ✓ Settings page — display name always editable, username locked after first save
- PROF-03 ✓ Stats row: total public · avg score · top niche · personal best
- PROF-04 ✓ Revision chains with inline score deltas, clickable version pills
- PROF-05 ✓ Avatar: initials badge on profile header (64px) and NavBar (28px)

## Phase 20 Complete ✓
