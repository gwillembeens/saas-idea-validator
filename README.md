# SaaS Idea Validator

An investor-grade SaaS idea analysis tool. Paste a startup idea and receive a structured validation report scored against a 30-step framework for building agent-native SaaS businesses — streamed live in under a minute.

## What It Does

1. **Paste your idea** — describe your target customer, the problem, and your proposed solution
2. **Get instant analysis** — Claude evaluates it against 4 phases: Market & Niche, Content & Distribution, Product & Agent Architecture, Pricing & Moat
3. **See your scorecard** — each phase scored 1–5, with weighted total and verdict (Strong Signal → Too Vague)

## Stack

- **Frontend**: React 18 + Vite + Redux Toolkit + Tailwind CSS v3
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514, streaming)
- **Design**: Hand-drawn sketchbook aesthetic (Kalam + Patrick Hand fonts)

## Prerequisites

- Node.js 18+ (`node --version` to check)
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd saas-idea-validator
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure your API key

```bash
cp .env.example .env
```

Open `server/.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

## Running Locally

You need two terminals running simultaneously.

**Terminal 1 — Start the server:**

```bash
cd server
npm run dev
# Server listening on port 3001
```

**Terminal 2 — Start the client:**

```bash
cd client
npm run dev
# Local: http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

The Vite dev server proxies all `/api` requests to `localhost:3001`, so the Anthropic API key stays server-side and never reaches the browser. Claude's response streams back in real time — you see the analysis as it's written.

## Project Structure

```
saas-idea-validator/
├── server/
│   ├── index.js          ← Express entry point (port 3001)
│   ├── routes/
│   │   └── validate.js   ← POST /api/validate — calls Claude, streams response
│   ├── systemPrompt.js   ← The 30-step validator framework prompt
│   └── .env              ← Your API key (never committed)
└── client/
    ├── src/
    │   ├── App.jsx        ← Page layout
    │   ├── hooks/
    │   │   └── useValidate.js   ← Streaming fetch + Redux dispatch
    │   ├── store/
    │   │   └── slices/
    │   │       └── validatorSlice.js  ← idea / status / result / error
    │   ├── components/
    │   │   ├── validator/ ← IdeaInput, ResultsPanel, Scorecard, VerdictBadge
    │   │   ├── ui/        ← Button, Card, TextArea, ScoreBar
    │   │   └── decorative/ ← Arrow, Squiggle
    │   └── utils/
    │       └── parseResult.js   ← Extracts phase scores from markdown
    └── vite.config.js     ← Proxies /api → localhost:3001
```

## Scoring Framework

| Phase | Weight | Steps |
|-------|--------|-------|
| 1. Market & Niche | 30% | 1–5 |
| 2. Content & Distribution | 25% | 6–10 |
| 3. Product & Agent Architecture | 35% | 11–20 |
| 4. Pricing & Moat | 10% | 21–30 |

**Verdict thresholds:** 4.5–5.0 Strong Signal · 3.5–4.4 Promising · 2.5–3.4 Needs Work · 1.0–2.4 Too Vague
