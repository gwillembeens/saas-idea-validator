---
status: testing
phase: 01-project-scaffold
source: [01-SUMMARY.md]
started: 2026-03-21T21:00:00Z
updated: 2026-03-21T21:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running servers. In the server/ directory, copy server/.env.example to server/.env and add a placeholder API key. Run `node index.js` from server/. The server should boot on port 3001 without errors. GET http://localhost:3001/health should return a 200 response.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running servers. In the server/ directory, copy server/.env.example to server/.env and add a placeholder API key. Run `node index.js` from server/. The server should boot on port 3001 without errors. GET http://localhost:3001/health should return a 200 response.
result: [pending]

### 2. Client dev server starts
expected: From the client/ directory, run `npm run dev`. Vite should start without errors and open http://localhost:5173 in the browser. The page should load (even if mostly empty — this is the scaffold).
result: [pending]

### 3. Google Fonts load in browser
expected: Open http://localhost:5173. Open browser DevTools → Network tab → filter by "fonts.googleapis" or "fonts.gstatic". Two font families should be loaded: Kalam (700 weight) and Patrick Hand (400 weight). If text is visible on the page, headings should appear in a handwritten/bold style, body text in a clean handwritten style.
result: [pending]

### 4. .env protection — secrets not in git
expected: Run `git status` and `git log --all --oneline` from the project root. The file `server/.env` should NOT appear in any output. The `.gitignore` should prevent it from being tracked.
result: [pending]

### 5. Vite proxy config present
expected: Open `client/vite.config.js`. It should contain a `proxy` config that routes `/api` to `http://localhost:3001`. This won't be testable end-to-end until Phase 2, but the config should be present.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
