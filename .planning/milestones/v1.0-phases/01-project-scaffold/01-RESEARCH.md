# Phase 1 Research: Project Scaffold

**Research Date:** 2026-03-21
**Goal:** Establish the foundation for a monorepo with isolated server and client builds

---

## Summary

Phase 1 sets up a Node.js + React monorepo structure with independent `server/` and `client/` directories. The server runs Express on port 3001 with ES modules enabled; the client runs Vite with React 18 and proxies `/api` to the backend. Both use npm workspaces-free approach (separate `package.json` files) to keep setup simple and avoid workspace complexity in v1. Environment configuration is handled via `.env` (server-side only, never committed), and Git initialization creates a clean repo history.

---

## Stack Decisions

### Monorepo Structure: Independent Packages vs npm Workspaces

**Decision:** Use two independent `package.json` files, **not** npm workspaces.

**Rationale:**
- v1 is a small project with only two directories (`server/` and `client/`)
- npm workspaces add complexity: shared `node_modules`, hoisting rules, version conflict resolution
- Independent packages allow each to be installed/run separately without coordination
- Easier to deploy: each half can be packaged independently later
- Simpler .gitignore: each directory can have its own `node_modules/` at that level

**Structure:**
```
saas-idea-validator/
├── server/
│   ├── package.json
│   ├── node_modules/
│   └── index.js
├── client/
│   ├── package.json
│   ├── node_modules/
│   └── src/
└── .gitignore
```

Run `npm install` separately in each directory. Run `npm run dev` from root by starting both servers in parallel (either manually or via npm concurrently package at root level).

---

### ES Modules vs CommonJS for Express Server

**Decision:** Use ES modules (`import`/`export`) with `"type": "module"` in server `package.json`.

**Rationale:**
- CLAUDE.md examples use `import` syntax (e.g., `import Anthropic from '@anthropic-ai/sdk'`)
- Express 5.x fully supports ES modules
- Node.js ES modules are stable and widely adopted
- Required for client compatibility: Vite outputs ES modules natively
- Future-proof: Node.js deprecating CommonJS

**Requirements:**
- Add `"type": "module"` to `server/package.json`
- All `.js` files treated as ES modules
- Imports must include file extensions: `import { handler } from './routes/validate.js'`
- Node.js 18+ required (Express 5.x minimum requirement anyway)

**Important:** With `"type": "module"`, the following changes:
- `__dirname` and `__filename` are not defined; use `import.meta.url` if needed
- JSON imports require `assert { type: 'json' }` or dynamic import
- CommonJS modules (.cjs) can still be imported but less common

---

### Exact Dependency Versions

#### Server Dependencies

| Package | Version | Rationale |
|---------|---------|-----------|
| `express` | 5.2.1 | Latest stable (Oct 2024); dropped Node <18 support; improved error handling for promise rejection in middleware |
| `@anthropic-ai/sdk` | 0.80.0 | Latest (published 2 days ago as of 2026-03-21); includes streaming, message API, content blocks |
| `dotenv` | 16.4.5+ | Standard env loading; version 16+ supports `.env` parsing correctly |
| `cors` | 2.8.5+ | Enable CORS from Express to Vite dev client |

**Note on @anthropic-ai/sdk:** Version 0.80.0 includes:
- `client.messages.stream()` API for streaming responses
- Proper TypeScript types for streaming events (`content_block_delta`, `text_delta`)
- Compatible with Claude 3.5 Sonnet and newer models

#### Client Dependencies

| Package | Version | Rationale |
|---------|---------|-----------|
| `react` | 18.2.0+ | Stable React 18; no breaking changes expected |
| `react-dom` | 18.2.0+ | Match React version exactly |
| `vite` | 5.1.0+ | Latest stable; native ES modules, fast rebuild, proven with React |
| `@vitejs/plugin-react` | 4.2.0+ | Official Vite React plugin; handles JSX, Fast Refresh |
| `react-redux` | 9.0.4+ | Latest; RTK 2.x compatible |
| `@reduxjs/toolkit` | 2.11.2 | Latest (3 months ago); slice API, configureStore, immer integration |
| `react-markdown` | 9.0.0+ | Render Claude's markdown output safely |
| `lucide-react` | 0.396.0+ | Latest icon library; stroke-width 2.5 by default |
| `tailwindcss` | 3.4.1+ | **Explicitly v3** (NOT v4); requires PostCSS config |
| `postcss` | 8.4.35+ | Required by Tailwind v3 |
| `autoprefixer` | 10.4.17+ | Required by Tailwind v3 |

**Critical:** CLAUDE.md explicitly requires **Tailwind CSS v3**. Do NOT use v4 — it removes `tailwind.config.js` and requires a Vite plugin instead. The custom design system (wobbly borders, hard shadows, custom colors/fonts) depends on `tailwind.config.js` which is v3-specific.

---

### Node.js Minimum Version

**Requirement:** Node.js 18+ (LTS recommended: 20 or 22)

**Rationale:**
- Express 5.x requires Node 18+
- ES modules fully stable on 18+
- Current LTS are 20.x and 22.x; 18.x EOL April 2025 (acceptable but aged)

**Verify before starting:**
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

---

## Step-by-Step Setup

### 1. Initialize Git Repository

```bash
# In the monorepo root: /Users/gijsbeens/Projects/saas-idea-validator/saas-idea-validator
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

**Why first:** Git initialized before any npm operations ensures clean history and prevents committing node_modules.

### 2. Create .gitignore

**Location:** Root of monorepo
**Contents:** (see ".gitignore Entries" section below)

**Action:** Create before running `npm install` anywhere.

### 3. Set Up Server

```bash
# Create directory
mkdir -p server

# Initialize server package.json
cd server
npm init -y

# IMPORTANT: Add "type": "module" to package.json after init
# Edit server/package.json and ensure it has:
# { "type": "module", "name": "saas-validator-server", ... }

# Install dependencies
npm install express @anthropic-ai/sdk dotenv cors

# Create entry point
touch index.js
```

**package.json additions after `npm init -y`:**
```json
{
  "type": "module",
  "name": "saas-validator-server",
  "version": "1.0.0",
  "description": "Express backend for SaaS Idea Validator",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "node --watch index.js",
    "start": "node index.js"
  }
}
```

**Create server/.env.example (template, never committed):**
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
PORT=3001
```

**Copy to server/.env (NOT committed, user fills in API key):**
```bash
cp server/.env.example server/.env
# User manually adds ANTHROPIC_API_KEY to server/.env
```

### 4. Set Up Client

```bash
# Create directory
mkdir -p client

# Generate Vite React scaffold
cd client
npm create vite@latest . -- --template react

# When prompted to select a variant, choose "react" (not TypeScript for simplicity)

# Install additional dependencies
npm install react-redux @reduxjs/toolkit react-markdown lucide-react

# Install dev dependencies for Tailwind
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind (creates tailwind.config.js and postcss.config.js)
npx tailwindcss init -p
```

**Note on `npm create vite@latest . -- --template react`:**
- The `.` scaffold into the current directory (client/)
- Files generated: `index.html`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, etc.
- Do NOT delete `src/App.jsx` — it's the entry point; we'll replace contents in Phase 4

### 5. Update client/vite.config.js

After Vite scaffold, update `vite.config.js` to add the API proxy:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### 6. Create Root-Level .env.example (Documentation)

```bash
# In monorepo root
touch .env.example
```

**Content:**
```
# Server environment (see server/.env)
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
# PORT=3001
```

This documents the setup without exposing secrets.

### 7. Initialize First Git Commit

```bash
# From monorepo root
git add .gitignore server/package.json server/package-lock.json client/package.json client/package-lock.json client/vite.config.js
git add .env.example server/.env.example

# Do NOT add node_modules/ or .env (real secrets)

git commit -m "chore: initialize monorepo scaffold with Express server and Vite React client"

# Verify history
git log --oneline
```

---

## Tailwind CSS v3 Setup

### Critical: Do NOT Use Tailwind v4

**Tailwind v4 (released early 2025) fundamentally changed setup:**
- Removed `tailwind.config.js` requirement
- Changed from `@tailwind` directives to `@import "tailwindcss"`
- Requires `@tailwindcss/vite` plugin in vite.config.js
- NO custom config file support in the old way

**Our project requires v3 because:**
- CLAUDE.md explicitly specifies `module.exports = { extend: { colors: {...} } }`
- Custom tokens (wobbly border-radius, hard shadows, hand-drawn fonts) defined in `tailwind.config.js`
- Design system depends on classic Tailwind v3 config structure

### Tailwind v3 with Vite Setup (Correct Path)

**1. Install correct version:**
```bash
cd client
npm install -D tailwindcss@3 postcss autoprefixer
# Remove @tailwindcss/vite if npm mistakenly installed it
npm uninstall -D @tailwindcss/vite
```

**2. Generate config files:**
```bash
npx tailwindcss init -p
```

This creates:
- `client/tailwind.config.js` — extend with custom tokens
- `client/postcss.config.js` — AutoPrefixer for vendor prefixes

**3. tailwind.config.js — Insert Custom Tokens:**

Replace the generated `tailwind.config.js` with:

```javascript
module.exports = {
  content: ['./src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        paper: '#fdfbf7',
        pencil: '#2d2d2d',
        muted: '#e5e0d8',
        accent: '#ff4d4d',
        blue: '#2d5da1',
        postit: '#fff9c4',
      },
      fontFamily: {
        heading: ['Kalam', 'cursive'],
        body: ['Patrick Hand', 'cursive'],
      },
      borderRadius: {
        wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
        wobblyMd: '15px 225px 15px 255px / 225px 15px 255px 15px',
      },
      boxShadow: {
        hard: '4px 4px 0px 0px #2d2d2d',
        hardLg: '8px 8px 0px 0px #2d2d2d',
        hardSm: '2px 2px 0px 0px #2d2d2d',
        hardRed: '4px 4px 0px 0px #ff4d4d',
      },
    },
  },
}
```

**4. Add Tailwind directives to client/src/index.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**5. Import in client/src/main.jsx:**

Ensure `index.css` is imported:
```javascript
import './index.css'
```

**6. Vite config — NO changes needed for Tailwind v3:**

The default `vite.config.js` works as-is; PostCSS is automatically applied.

---

## Vite Proxy Config

### Goal
Forward `/api/*` requests from the React dev server (port 5173) to the Express server (port 3001).

### Implementation

**File:** `client/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Optional: rewrite paths if needed
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
```

### How It Works

1. Client code does: `fetch('/api/validate', { method: 'POST', ... })`
2. Vite dev server intercepts requests starting with `/api`
3. Forwards to `http://localhost:3001/api/validate`
4. Response returned to client as if same-origin

### Important Notes

- **Development only:** `server.proxy` applies only to `npm run dev`, not after build
- **changeOrigin: true:** Adjusts the Host header so backend sees requests as from the target origin (localhost:3001), not the dev server origin
- Both servers must run simultaneously (server on 3001, Vite on 5173)

---

## .gitignore Entries

**Location:** Root of monorepo

```
# Dependencies
node_modules/
*/node_modules/

# Environment variables (NEVER commit .env with real secrets)
.env
.env.local
.env.*.local
server/.env

# Build outputs
dist/
build/
out/

# Dev server
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
.cache/
coverage/
```

**Rationale:**
- `node_modules/` at root and subdirectories (independent packages generate their own)
- `.env` and `server/.env` NEVER committed (contains API keys)
- `.env.example` and `server/.env.example` ARE committed (templates, no secrets)
- `.vite/` is Vite's internal cache
- `dist/` is build output (client after `npm run build`)

---

## Validation Architecture

### How to Verify Phase 1 is Complete

Run these commands to confirm setup:

**1. Verify directory structure:**
```bash
# From monorepo root
ls -la
# Expected: server/, client/, .gitignore, .env.example

ls server/
# Expected: package.json, package-lock.json, node_modules/, index.js, .env.example, .env (not in git)

ls client/
# Expected: package.json, package-lock.json, node_modules/, vite.config.js, tailwind.config.js, postcss.config.js, src/, index.html
```

**2. Verify npm installations:**
```bash
cd server && npm list express @anthropic-ai/sdk dotenv cors
# Should show versions installed without errors

cd ../client && npm list react react-dom vite @vitejs/plugin-react tailwindcss react-redux @reduxjs/toolkit
# Should show all versions installed
```

**3. Verify ES modules in server:**
```bash
grep '"type".*"module"' server/package.json
# Should output: "type": "module"
```

**4. Verify Vite proxy config:**
```bash
grep -A 5 "proxy:" client/vite.config.js
# Should show /api proxy to http://localhost:3001
```

**5. Verify Tailwind v3 (not v4):**
```bash
grep "tailwindcss" client/package.json
# Should show @3.x (not @4.x)

ls client/tailwind.config.js client/postcss.config.js
# Both files should exist
```

**6. Verify .env handling:**
```bash
cat server/.env.example
# Should show ANTHROPIC_API_KEY placeholder and PORT=3001

cat .env.example
# Should exist at root
```

**7. Verify Git initialized:**
```bash
git log --oneline
# Should show at least one commit

git status
# Should show clean working tree (after first commit)

grep -E "node_modules|\.env$" .gitignore
# Should confirm node_modules and .env are ignored
```

**8. Start both servers (dry-run test):**
```bash
# Terminal 1: Start server
cd server
npm run dev
# Should output: listening on port 3001 (or similar)

# Terminal 2: Start client (in new terminal)
cd client
npm run dev
# Should output: Local: http://localhost:5173 (or similar)
# Should output: proxy: /api → http://localhost:3001

# Verify Vite can start without errors (CTRL+C to stop)
```

**9. Verify Git history:**
```bash
git log --oneline --all
# Should show scaffold commit only

git status
# Should show clean tree with no unstaged files
```

### Acceptance Criteria Checklist

- [ ] `server/` directory exists with `package.json`, `index.js`, `node_modules/`, `.env`, `.env.example`
- [ ] `client/` directory exists with `package.json`, `src/`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `node_modules/`
- [ ] `server/package.json` contains `"type": "module"`
- [ ] All required dependencies installed (no `npm install` errors)
- [ ] `.gitignore` excludes `node_modules/`, `.env`, `.vite/`, `dist/`
- [ ] `.env.example` files exist at root and `server/` (for documentation)
- [ ] `server/.env` exists locally but is NOT in git
- [ ] `vite.config.js` proxy configured to forward `/api` to `http://localhost:3001`
- [ ] `tailwind.config.js` extends with custom colors, fonts, border-radius, shadows
- [ ] Git repo initialized with one clean scaffold commit
- [ ] Both servers can start without errors (tested with `npm run dev`)

---

## Pitfalls to Avoid

### 1. **Using Tailwind v4 Instead of v3**

**Mistake:** Installing `tailwindcss@latest` without specifying version.
**Why it breaks:** Tailwind v4 doesn't have `tailwind.config.js`; it uses `@import "tailwindcss"` in CSS. Custom tokens can't be defined the old way.
**Fix:** Explicitly install `tailwindcss@3` (not latest).

### 2. **Forgetting `"type": "module"` in server/package.json**

**Mistake:** Using `import` syntax without `"type": "module"`.
**Why it breaks:** Node.js treats `.js` as CommonJS; `import` statements throw "ERR_REQUIRE_ESM" error.
**Fix:** Add `"type": "module"` to `server/package.json` before running code.

### 3. **Using npm Workspaces Prematurely**

**Mistake:** Running `npm init -w` or `npm install -w server -w client`.
**Why it breaks:** Workspaces hoist `node_modules` to root; each package shares versions. For v1, independent packages are simpler.
**Fix:** Use two separate `npm install` commands in each directory.

### 4. **Committing .env File**

**Mistake:** Running `git add .` and committing `server/.env` with real API keys.
**Why it breaks:** Secrets exposed in public repo; API key compromised.
**Fix:** Ensure `.env` is in `.gitignore` BEFORE first commit. Commit `.env.example` instead.

### 5. **Running npm Install from Monorepo Root**

**Mistake:** `npm install` from root instead of in `server/` and `client/` directories.
**Why it breaks:** npm tries to find `package.json` at root; fails if none exists.
**Fix:** Always `cd server && npm install`, then `cd ../client && npm install`.

### 6. **Not Running Both Servers Simultaneously**

**Mistake:** Starting only the Express server or only Vite, then wondering why proxying doesn't work.
**Why it breaks:** Vite proxy can't reach Express if Express isn't running. React can't load if Vite isn't serving.
**Fix:** Use two terminal windows: one for `npm run dev` in `server/`, one in `client/`.

### 7. **File Extension Mismatches with ES Modules**

**Mistake:** Importing local modules without `.js` extension: `import { fn } from './utils'`.
**Why it breaks:** With `"type": "module"`, Node requires explicit extensions.
**Fix:** Always use `import { fn } from './utils.js'` (with `.js`).

### 8. **Misconfiguring Vite Proxy Path Rewriting**

**Mistake:** Proxy forwarding `/api` to backend, but backend routes expect `/api/validate` and rewrite strips it.
**Why it breaks:** Request to `/api/validate` becomes `/validate` on backend; route not found.
**Fix:** Don't use `rewrite` unless you have a good reason. Backend should also expect `/api/validate`.

### 9. **Using Soft Shadows in Tailwind Before Installing Custom Config**

**Mistake:** Using `shadow-md` (soft blur) before custom `hard` shadow tokens are defined.
**Why it breaks:** Tailwind config not loaded yet; using default shadows instead of hard offsets.
**Fix:** Wait until Phase 4 (Component Design) to reference `shadow-hard`, `shadow-hardLg`, etc. Phase 1 is scaffolding only.

### 10. **Installing TypeScript Without Deliberate Choice**

**Mistake:** Running `npm create vite@latest . -- --template react-ts` when CLAUDE.md doesn't require TS.
**Why it breaks:** Extra toolchain (tsc, tsconfig.json) adds complexity; slower build in dev.
**Fix:** Use `--template react` (no-TS) for v1. Can add TS later if needed.

---

## Post-Phase-1 Setup (Optional Enhancements)

These are NOT required for Phase 1 success but are helpful after scaffold:

### Root-Level npm Scripts (Optional)

Create a root `package.json` to start both servers with one command:

```json
{
  "name": "saas-idea-validator",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install-all": "npm install && npm install --prefix server && npm install --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Then install concurrently at root:
```bash
npm install -D concurrently
```

Now `npm run dev` from root starts both servers. (But this is OPTIONAL for Phase 1.)

### nodemon for Server Auto-Restart (Optional)

For faster development, add nodemon to server:

```bash
cd server
npm install -D nodemon
```

Update `server/package.json`:
```json
"scripts": {
  "dev": "nodemon --exec node --watch . index.js"
}
```

---

## RESEARCH COMPLETE

This research provides the exact versions, setup steps, configuration files, validation commands, and common pitfalls needed to execute Phase 1 successfully. The key decisions are:

1. **Independent packages** (not npm workspaces) for simplicity
2. **ES modules** with `"type": "module"` for Express server
3. **Tailwind v3 explicitly** (not v4) to support custom config
4. **Vite proxy** to forward `/api` to Express backend
5. **Clean .gitignore** to never commit `.env` with secrets

All steps, versions, and commands are concrete and actionable. Validation checklist confirms Phase 1 success.

---

**Document Version:** 1.0
**Last Updated:** 2026-03-21
**Status:** Ready for Phase 1 Implementation
