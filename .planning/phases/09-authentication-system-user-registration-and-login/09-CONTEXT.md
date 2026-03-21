---
phase: 9
name: Authentication system — user registration and login
status: context_complete
created: 2026-03-21
---

# Phase 9 Context — Authentication System

## Goal

Add user registration, login, logout, forgot password/email reset, and Google + GitHub OAuth to the app. Auth gates the Validate action — users can type an idea freely but must be logged in to run a validation. Sessions persist across browser closes.

---

<domain>
## Phase Boundary

Deliver a complete authentication system: email/password register + login, email verification on signup, forgot password / email reset, Google OAuth, GitHub OAuth, persistent sessions, and a "Sign in" button in the app header. Auth gates the Validate action (not the page). Saving ideas is Phase 10 — not in scope here.

</domain>

<decisions>
## Implementation Decisions

### Auth gate behaviour
- **D-01:** Users can paste an idea into the textarea without logging in
- **D-02:** Clicking "Validate" without being logged in triggers an auth modal (not a redirect) — preserves the typed idea so validation continues immediately after login
- **D-03:** Auth also enables per-user usage tracking (foundation for future rate limiting — not implemented this phase)

### Session strategy
- **D-04:** httpOnly cookies + JWT — more secure than localStorage, works with Vercel (stateless) + Railway (backend)
- **D-05:** Sessions persist across browser closes — 30-day JWT expiry with refresh token rotation
- **D-06:** Frontend (React/Vite) deploys to Vercel; Express backend + Postgres deploy together on Railway

### Registration & login flow
- **D-07:** Email verification required on signup — account is inactive until user clicks the link
- **D-08:** Forgot password / email reset flow in scope this phase
- **D-09:** Google OAuth + GitHub OAuth both in scope this phase
- **D-10:** Login and Register live on the same page/modal with a toggle between them (not separate routes)
- **D-11:** "Sign in" / user avatar button lives top-right of the app header

### Auth wall UX
- **D-12:** Auth wall is a modal overlay — slides up when unauthenticated user clicks Validate
- **D-13:** After successful login/register via modal, validation proceeds automatically (no manual re-click)

### Database & email
- **D-14:** Postgres on Railway (same Railway project as Express backend)
- **D-15:** Resend for transactional email (verification links, password reset) — chosen for DX and free tier
- **D-16:** Users table: id, email, password_hash, email_verified, created_at, updated_at
- **D-17:** OAuth accounts table: id, user_id, provider (google|github), provider_account_id, created_at

### Design system
- **D-18:** Login/register modal and all auth UI follows the same hand-drawn design system — wobbly borders (inline style), hard offset shadows, Kalam headings, Patrick Hand body/inputs, text-pencil colour

### Claude's Discretion
- Exact JWT payload structure and signing algorithm (RS256 or HS256)
- Refresh token storage strategy (httpOnly cookie vs. DB-backed)
- Passport.js vs. custom OAuth vs. Auth.js (better-auth) — pick the most maintainable for this stack
- Password complexity rules
- Rate limiting on auth endpoints (brute-force protection)
- Exact modal animation and entry point trigger in ResultsPanel

</decisions>

<specifics>
## Specific Ideas

- Auth wall should feel natural — not punishing. User typed their idea, modal slides in, they log in, validation fires. Zero friction.
- The "Sign in" button top-right should transform to a user avatar / email indicator once logged in
- Modal toggle between Login ↔ Register should be smooth — not a full re-render, just a form swap
- Design consistent with existing cards: wobbly border-radius inline style, shadow-hard, font-heading for the modal title

</specifics>

<canonical_refs>
## Canonical References

No external specs yet — requirements are fully captured in decisions above.

### Existing codebase — must read before planning
- `CLAUDE.md` — full design system spec, tech stack, architecture rules
- `server/index.js` — current Express setup (ES modules, cors, json middleware)
- `server/routes/validate.js` — existing route pattern to follow for auth routes
- `client/src/store/slices/validatorSlice.js` — Redux pattern; auth state will need its own slice
- `client/src/App.jsx` — current layout; Sign In button and auth modal wire in here
- `client/src/components/ui/Card.jsx` — reuse for modal container
- `client/src/components/ui/Button.jsx` — reuse for form submit buttons
- `client/src/components/ui/TextArea.jsx` or input equivalent — reuse for email/password fields
- `client/tailwind.config.js` — design tokens (colors, fonts, shadows)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component: `decoration`, `rotate`, `className` props — ideal modal container
- `Button` component: primary/secondary variants — use for Submit, OAuth buttons
- Redux Toolkit slice pattern (validatorSlice) — mirror for `authSlice` with `{ user, status, error }`
- Express ES module pattern — auth routes follow same `export async function` convention
- `.env` pattern already established — add `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, `RESEND_API_KEY`, `DATABASE_URL`

### Established Patterns
- Redux for all app state — `authSlice` manages `{ user: null | { id, email }, status: 'idle'|'loading'|'error', error: null }`
- Custom hooks (`useValidate`) — mirror with `useAuth` hook
- Named exports throughout — keep consistent
- Server uses ES modules (`import`/`export`) — no CommonJS

### Integration Points
- `ResultsPanel.jsx` or `IdeaInput.jsx`: intercept the Validate click → check auth state → show modal if not authenticated
- `App.jsx`: add `<AuthModal />` and header Sign In button
- `server/index.js`: mount `/api/auth/*` routes (register, login, logout, verify-email, reset-password, oauth callbacks)
- Redux store: add `authSlice` to store, persist user to localStorage or read from JWT cookie on app load

</code_context>

<deferred>
## Deferred Ideas

- Rate limiting per user on validations — Phase 10 or later
- Admin dashboard / user management — out of scope for v1
- Two-factor authentication (2FA) — future phase
- Team/organisation accounts — future phase
- Subscription / paywall tiers — future phase

</deferred>

---

*Phase: 09-authentication-system-user-registration-and-login*
*Context gathered: 2026-03-21*
