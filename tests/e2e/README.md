# E2E Tests: Split-Card Results Layout

E2E tests for the SaaS Idea Validator's split-card results layout using Playwright.

## Running Tests

### Headless mode (CLI, automated)
```bash
npm run test:e2e
```

### UI mode (interactive, with UI browser)
```bash
npm run test:e2e:ui
```

### Debug mode (step through tests)
```bash
npm run test:e2e:debug
```

## Test Coverage (8 tests)

1. **Home page loads with validation form** — Verifies the home page renders with input form visible
2. **Validation form is rendered with correct labels** — Checks textarea and submit button ("Validate Idea") are visible
3. **Split-card result components are defined and styled** — Visits /framework to verify card structure exists
4. **Scorecard heading is present in result components** — Confirms "Scorecard" component is defined in the page
5. **Verdict and Commentary cards are defined** — Confirms "Verdict" and "Commentary" components are defined
6. **Desktop layout (1280px): components load correctly** — Validates form visibility at desktop viewport, captures screenshot
7. **Mobile layout (375px): components load correctly** — Validates form visibility at mobile viewport, captures screenshot
8. **Page uses Patrick Hand font** — Verifies Google Fonts link for Patrick Hand is loaded

## Prerequisites

- **Dev server running:** Tests auto-start the Vite dev server (`npm --prefix client run dev`)
- **No backend required:** Frontend E2E tests validate component visibility only, not API integration
- **Playwright installed:** Run `npm install --save-dev @playwright/test` in project root if missing

## Configuration

- **Base URL:** `http://localhost:5173` (Vite dev server)
- **Timeout:** 60s per test, 10s per assertion
- **Browser:** Chromium headless
- **Test directory:** `tests/e2e/`

## Troubleshooting

**Tests timeout after 60 seconds**
- Vite dev server may not have started. Check that port 5173 is free.
- Kill any other Node processes: `pkill -f "node\|vite"`

**"Selector 'textarea' not found"**
- Home page component structure changed. Verify IdeaInput.jsx still renders a textarea element.
- Check `client/src/components/validator/IdeaInput.jsx` has the textarea.

**"Patrick Hand font link not found"**
- Google Fonts link missing from `client/index.html`.
- Add: `<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet" />`

**Screenshots not saved**
- `test-results/` directory is created by Playwright. Check file permissions.
- Screenshots are saved only on failure by default; tests 6 & 7 capture on success explicitly.

## CI Integration

Add to GitHub Actions / CI pipeline:
```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

Tests will exit with code 0 on pass, non-zero on failure. All 8 tests must pass for CI to succeed.
