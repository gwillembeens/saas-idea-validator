---
plan: 01
phase: 1
wave: 1
depends_on: []
files_modified:
  - server/package.json
  - server/index.js
  - server/.env.example
  - server/.env
  - client/package.json
  - client/vite.config.js
  - client/tailwind.config.js
  - client/postcss.config.js
  - client/src/index.css
  - client/src/main.jsx
  - client/index.html
  - .gitignore
  - .env.example
autonomous: true
requirements_addressed: [BACK-01, BACK-02, BACK-05]
---

# Plan 01: Monorepo Scaffold with Express & Vite

## Objective

Establish the foundational monorepo structure with independent `server/` (Express.js) and `client/` (Vite + React) directories. Configure ES modules, Tailwind v3 custom tokens, environment variables, and Vite API proxy. Initialize git with clean history.

## must_haves

- Express server runs on port 3001 with `"type": "module"` enabled
- Client proxies `/api` requests to `http://localhost:3001` in dev
- `.env` with API key never committed; `.env.example` documents setup
- Tailwind v3 (not v4) with custom design tokens configured
- Google Fonts (Kalam 700, Patrick Hand 400) loaded in index.html
- Git initialized with scaffold commit
- All npm dependencies installed without errors

## Tasks

<task id="1-01-01">
<title>Create directory structure and initialize git</title>
<read_first>
- CLAUDE.md — project structure reference (server/ and client/ directories)
- .planning/phases/01-project-scaffold/01-RESEARCH.md — detailed setup instructions
</read_first>
<action>
From monorepo root (/Users/gijsbeens/Projects/saas-idea-validator/saas-idea-validator), create server and client directories if they don't exist:

```bash
mkdir -p server client
```

Initialize git if not already done (check with `git rev-parse --git-dir` first):
```bash
git init
```

Verify structure:
```bash
ls | grep -E "^server$|^client$"
```

Expected output shows both `server` and `client` directories.
</action>
<acceptance_criteria>
- `git rev-parse --git-dir` returns `.git` (repo initialized)
- `ls server` exits 0 (directory exists)
- `ls client` exits 0 (directory exists)
</acceptance_criteria>
</task>

<task id="1-01-02">
<title>Set up server with Express and ES modules</title>
<read_first>
- .planning/phases/01-project-scaffold/01-RESEARCH.md — exact dependency versions and package.json structure
- CLAUDE.md — server entry point reference (server/index.js)
</read_first>
<action>
1. Navigate to server/ and initialize package.json:
   ```bash
   cd server && npm init -y
   ```

2. Replace entire contents of `server/package.json` with:
   ```json
   {
     "name": "saas-validator-server",
     "version": "1.0.0",
     "description": "Express backend for SaaS Idea Validator",
     "type": "module",
     "main": "index.js",
     "scripts": {
       "dev": "node --watch index.js",
       "start": "node index.js"
     },
     "keywords": [],
     "author": "",
     "license": "ISC",
     "dependencies": {
       "express": "^5.2.1",
       "@anthropic-ai/sdk": "^0.80.0",
       "dotenv": "^16.4.5",
       "cors": "^2.8.5"
     }
   }
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `server/index.js` with placeholder Express entry point:
   ```javascript
   import 'dotenv/config'
   import express from 'express'
   import cors from 'cors'

   const app = express()
   const PORT = process.env.PORT || 3001

   app.use(cors())
   app.use(express.json())

   app.get('/health', (req, res) => {
     res.json({ status: 'ok' })
   })

   app.listen(PORT, () => {
     console.log(`Server listening on port ${PORT}`)
   })
   ```

5. Create `server/.env.example`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
   PORT=3001
   ```

6. Create `server/.env` by copying the example (user will fill in real API key):
   ```bash
   cp server/.env.example server/.env
   ```
</action>
<acceptance_criteria>
- `grep '"type".*"module"' server/package.json` returns a match
- `grep '"name".*"saas-validator-server"' server/package.json` returns a match
- `server/index.js` exists and contains `import express from 'express'`
- `server/.env.example` exists and contains `ANTHROPIC_API_KEY=sk-ant-`
- `server/.env` exists (not committed to git)
- `ls server/node_modules/express` exits 0 (dependency installed)
- `ls server/node_modules/@anthropic-ai/sdk` exits 0
</acceptance_criteria>
</task>

<task id="1-01-03">
<title>Set up client with Vite, React 18, and all frontend dependencies</title>
<read_first>
- .planning/phases/01-project-scaffold/01-RESEARCH.md — client dependency versions and Vite setup
- CLAUDE.md — client structure reference and full dependency list
</read_first>
<action>
1. Navigate to client/ and scaffold Vite React project:
   ```bash
   cd client && npm create vite@latest . -- --template react
   ```
   When prompted to overwrite, confirm.

2. Install Redux, markdown, icons:
   ```bash
   npm install react-redux @reduxjs/toolkit react-markdown lucide-react
   ```

3. Install Tailwind CSS v3 (explicitly NOT v4) with PostCSS:
   ```bash
   npm install -D tailwindcss@3 postcss autoprefixer
   ```

4. Initialize Tailwind config:
   ```bash
   npx tailwindcss init -p
   ```
   This creates `tailwind.config.js` and `postcss.config.js`.

5. Replace entire contents of `client/tailwind.config.js` with:
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

6. Update `client/vite.config.js` to add API proxy. Replace entire contents with:
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

7. Ensure `client/src/index.css` starts with Tailwind directives (replace or prepend):
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

8. Ensure `client/src/main.jsx` imports index.css. It should contain:
   ```javascript
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.jsx'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
   )
   ```

9. Add Google Fonts to `client/index.html`. Inside `<head>`, before `</head>`, add:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Patrick+Hand&display=swap" rel="stylesheet" />
   ```
</action>
<acceptance_criteria>
- `grep '"react"' client/package.json` returns version 18.x or higher
- `grep 'tailwindcss' client/package.json` contains `@3.` (NOT `@4.`)
- `client/tailwind.config.js` contains `paper: '#fdfbf7'`
- `client/tailwind.config.js` contains `heading: ['Kalam', 'cursive']`
- `client/tailwind.config.js` contains `wobbly: '255px 15px 225px`
- `client/tailwind.config.js` contains `hard: '4px 4px 0px 0px #2d2d2d'`
- `client/vite.config.js` contains `'/api'` and `target: 'http://localhost:3001'`
- `client/src/index.css` contains `@tailwind base;`
- `client/src/main.jsx` contains `import './index.css'`
- `client/index.html` contains `googleapis.com/css2?family=Kalam:wght@700&family=Patrick+Hand`
- `ls client/node_modules/react` exits 0
- `ls client/node_modules/@reduxjs/toolkit` exits 0
- `ls client/node_modules/react-markdown` exits 0
- `ls client/node_modules/lucide-react` exits 0
</acceptance_criteria>
</task>

<task id="1-01-04">
<title>Create .gitignore and root environment documentation</title>
<read_first>
- .planning/phases/01-project-scaffold/01-RESEARCH.md — .gitignore entries section
</read_first>
<action>
1. Create `.gitignore` at monorepo root with:
   ```
   # Dependencies
   node_modules/
   */node_modules/

   # Environment variables — NEVER commit .env with real secrets
   .env
   .env.local
   .env.*.local
   server/.env

   # Build outputs
   dist/
   build/
   out/

   # Dev server cache
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

   # Coverage / misc
   .cache/
   coverage/
   ```

2. Create `.env.example` at root:
   ```
   # Server environment — copy to server/.env and fill in real values
   # ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
   # PORT=3001
   ```
</action>
<acceptance_criteria>
- `.gitignore` exists at monorepo root
- `grep "^node_modules/$" .gitignore` matches
- `grep "^\\.env$" .gitignore` matches (exactly `.env`, not `.env.example`)
- `grep "^server/.env$" .gitignore` matches
- `grep "^\\.vite/$" .gitignore` matches
- `.env.example` exists at root and contains `ANTHROPIC_API_KEY=sk-ant-` (commented, no real key)
- `git check-ignore server/.env` returns `server/.env` (confirms it would be ignored)
- `git check-ignore server/.env.example` is empty (example files are NOT ignored)
</acceptance_criteria>
</task>

<task id="1-01-05">
<title>Make initial git commit with scaffold</title>
<read_first>
- .planning/phases/01-project-scaffold/01-RESEARCH.md — git initialization section
</read_first>
<action>
1. From monorepo root, stage all scaffold files (explicitly, not `git add -A`):
   ```bash
   git add .gitignore .env.example
   git add server/package.json server/package-lock.json server/.env.example server/index.js
   git add client/package.json client/package-lock.json client/vite.config.js
   git add client/tailwind.config.js client/postcss.config.js client/index.html
   git add client/src/
   ```

2. Confirm nothing sensitive is staged — verify `server/.env` is NOT listed:
   ```bash
   git status --short
   ```
   Check output: `server/.env` must NOT appear. If it does, run `git reset HEAD server/.env`.

3. Create scaffold commit:
   ```bash
   git commit -m "chore: initialize monorepo scaffold with Express server and Vite React client

   - server/: Express 5 with ES modules, Anthropic SDK, dotenv, cors
   - client/: Vite + React 18, Redux Toolkit, Tailwind v3 with custom design tokens
   - Tailwind config: paper/pencil palette, Kalam/Patrick Hand fonts, wobbly borders, hard shadows
   - Vite proxy: /api → http://localhost:3001
   - Google Fonts: Kalam 700 + Patrick Hand 400 in index.html
   - .gitignore: excludes .env, node_modules, dist, .vite"
   ```
</action>
<acceptance_criteria>
- `git log --oneline | grep "chore: initialize monorepo scaffold"` matches
- `git status` returns "nothing to commit, working tree clean"
- `git ls-files server/.env` returns empty (NOT tracked)
- `git ls-files server/.env.example` returns `server/.env.example` (IS tracked)
- `git ls-files client/tailwind.config.js` returns `client/tailwind.config.js` (IS tracked)
- `git ls-files | grep node_modules` returns empty (node_modules NOT tracked)
</acceptance_criteria>
</task>

## Verification

Run this suite from monorepo root to confirm Phase 1 is complete:

```bash
# Directory structure
echo "=== Directory structure ===" && ls server/ client/ .gitignore

# ES modules enabled
echo "=== ES modules ===" && grep '"type".*"module"' server/package.json

# Tailwind v3 (not v4)
echo "=== Tailwind version ===" && grep 'tailwindcss' client/package.json | grep '@3'

# Custom design tokens
echo "=== Design tokens ===" && \
  grep 'paper.*#fdfbf7' client/tailwind.config.js && \
  grep 'heading.*Kalam' client/tailwind.config.js && \
  grep 'wobbly.*255px' client/tailwind.config.js && \
  grep 'hard.*4px 4px' client/tailwind.config.js

# Vite proxy
echo "=== Vite proxy ===" && grep -A 3 "'/api'" client/vite.config.js

# Google Fonts
echo "=== Google Fonts ===" && grep 'googleapis.com' client/index.html

# .env protection
echo "=== .env in .gitignore ===" && grep -c "^\.env$" .gitignore && grep -c "^server/\.env$" .gitignore

# Git state
echo "=== Git state ===" && git log --oneline && git status

# Dependencies
echo "=== Server deps ===" && cd server && npm list express @anthropic-ai/sdk dotenv cors && cd ..
echo "=== Client deps ===" && cd client && npm list react vite tailwindcss react-redux @reduxjs/toolkit react-markdown lucide-react && cd ..
```

All commands should exit 0 with expected output. Both servers should start:
- `cd server && npm run dev` → starts on port 3001
- `cd client && npm run dev` → starts on port 5173
