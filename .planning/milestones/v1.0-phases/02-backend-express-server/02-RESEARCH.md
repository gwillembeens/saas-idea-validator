---
phase: 02
type: research
date: 2026-03-21
---

# Research: Phase 2 — Backend Express Server

## Summary

Phase 2 implements the single Express route `POST /api/validate` that proxies the Anthropic Claude API with streaming. All specs are fully defined in CLAUDE.md. Research focuses on confirming exact SDK streaming API, ES module patterns, SSE headers, and route file structure.

---

## 1. Anthropic SDK Streaming (`@anthropic-ai/sdk@^0.80.0`)

### Import (ES modules)
```js
import Anthropic from '@anthropic-ai/sdk'
```

### `client.messages.stream()` signature
```js
const stream = client.messages.stream({
  model: 'claude-sonnet-4-20250514',   // exact model ID from CLAUDE.md
  max_tokens: 2000,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: idea }],
})
```

Returns a **MessageStream** — async iterable. Use `for await...of`.

### Chunk structure to handle
```js
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    res.write(chunk.delta.text)
  }
}
res.end()
```

Other chunk types (`message_start`, `content_block_start`, `content_block_stop`, `message_stop`) should be ignored — only `content_block_delta` + `text_delta` carries text.

### Error handling
- Wrap entire stream in try/catch
- Check `res.headersSent` before sending error response (if headers sent, just `res.end()`)
- Never log `ANTHROPIC_API_KEY` — only log sanitized error messages

---

## 2. Express 5 + ES Modules

### Entry point (`server/index.js`)
Already scaffolded correctly:
```js
import 'dotenv/config'      // loads .env — must be first
import express from 'express'
import cors from 'cors'
```

### Route file pattern
CLAUDE.md specifies `server/routes/validate.js` as a named export:
```js
// server/routes/validate.js
export async function validateRoute(req, res) { ... }
```

Mount in `index.js`:
```js
import { validateRoute } from './routes/validate.js'
app.post('/api/validate', validateRoute)
```

**Critical:** In ES modules, relative imports MUST include `.js` extension.

### `dotenv/config` in ES modules
`import 'dotenv/config'` (side-effect import) is the correct pattern for ES modules. Do NOT use `require('dotenv').config()`.

---

## 3. System Prompt File

CLAUDE.md specifies the system prompt lives in **two places**:
- `client/src/utils/systemPrompt.js` (for client-side reference)
- `server/systemPrompt.js` (for server-side Claude API call)

The server copy is a simple named export:
```js
// server/systemPrompt.js
export const SYSTEM_PROMPT = `...full validator prompt...`
```

The prompt text is fully specified in CLAUDE.md — copy verbatim.

---

## 4. SSE Headers for Streaming

```js
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
```

**No flush needed** — Node.js HTTP `res.write()` sends data immediately. Express does not buffer `write()` calls.

**No SSE event format needed** — CLAUDE.md specifies raw text streaming (not `data: ...\n\n` SSE format). The client reads via `ReadableStream` reader, not `EventSource`.

---

## 5. Input Validation

```js
const { idea } = req.body
if (!idea || idea.trim().length < 20) {
  return res.status(400).json({ error: 'Idea too short.' })
}
```

`express.json()` middleware must be registered before the route (already in `index.js`).

---

## 6. CORS Configuration

Currently: `app.use(cors())` — allows all origins. This is fine for v1 local development. Vite proxy (`/api → localhost:3001`) handles CORS in production dev flow, but the open CORS config is needed for direct API testing.

---

## 7. File Structure to Create

```
server/
├── index.js              ← update: add POST /api/validate route mounting
├── systemPrompt.js       ← create: export SYSTEM_PROMPT constant
└── routes/
    └── validate.js       ← create: validateRoute function
```

---

## 8. REQUIREMENTS.md Mapping

| Req ID | Description | Implementation |
|--------|-------------|----------------|
| BACK-01 | Express server starts on port from env | `server/index.js` reads `process.env.PORT` |
| BACK-02 | POST /api/validate with idea validation | `routes/validate.js` — 400 on < 20 chars |
| BACK-03 | API key never exposed to client | Key only in `process.env`, never logged/sent |
| BACK-04 | Streams Claude response | `client.messages.stream()` → `res.write()` loop |
| BACK-05 | text/event-stream headers | 3 SSE headers set before `res.write()` calls |

---

## 9. Pitfalls

1. **`.js` extensions in imports** — ES module imports in Node.js require explicit `.js` (e.g., `import { validateRoute } from './routes/validate.js'`)
2. **Headers before write** — SSE headers must be set before the first `res.write()` call
3. **`res.end()` after loop** — stream doesn't auto-close the response; must call `res.end()` explicitly
4. **`headersSent` check** — if the stream errors mid-stream, headers are already sent — don't try to send a JSON error response
5. **`dotenv/config` first** — must be the first import in `index.js` to ensure env vars are loaded before Anthropic client initializes

---

## Validation Architecture

### How to verify the streaming endpoint works

**Unit-level checks (grep-verifiable):**
- `server/routes/validate.js` exports `validateRoute` function
- `server/systemPrompt.js` exports `SYSTEM_PROMPT` constant
- `server/index.js` imports and mounts the route at `POST /api/validate`
- SSE headers appear in route file: `text/event-stream`, `no-cache`, `keep-alive`
- Input validation: `idea.trim().length < 20` pattern present
- Stream iteration: `content_block_delta` and `text_delta` checks present
- `res.end()` called after stream loop

**Integration checks (manual/curl):**
```bash
# Test 400 on short input
curl -s -X POST http://localhost:3001/api/validate \
  -H "Content-Type: application/json" \
  -d '{"idea":"short"}' | jq .

# Test streaming response
curl -s -X POST http://localhost:3001/api/validate \
  -H "Content-Type: application/json" \
  -d '{"idea":"A SaaS tool that helps small plumbing businesses automate their invoicing and scheduling"}' \
  --no-buffer
```

**Server startup check:**
```bash
cd server && node index.js
# Should print: Server listening on port 3001
```

---

## RESEARCH COMPLETE
