# Phase 16: Niche Auto-Detection — Research

## Summary

Phase 16 adds automatic niche classification to saved validation results. After a user's validation completes and the result is saved, a fire-and-forget async Claude API call (max_tokens=10) classifies the idea into one of 7 fixed niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other. The niche is stored in the database and displayed as a neutral-colored pill on the result page (between IdeaSummaryCard and Scorecard) and on history cards (footer row, after verdict, hidden on mobile). The feature is transparent during live streaming; niche surfaces only on revisits via GET /api/history/:id.

---

## DB Migration

### Current State
- `saved_results` table defined in `server/db/schema.sql` (lines 46–57)
- Columns: id, user_id, title, idea_text, markdown_result, scores (JSONB), created_at, updated_at, deleted_at
- Indexes: user_id (WHERE deleted_at IS NULL), created_at DESC (WHERE deleted_at IS NULL)
- No niche column exists

### Recommended Migration Approach
**In-place ALTER TABLE (no separate migration file needed)**

Add the niche column directly to the schema.sql file at the end of the saved_results table definition:
```sql
ALTER TABLE IF EXISTS saved_results ADD COLUMN IF NOT EXISTS niche VARCHAR(50) DEFAULT 'Other';
```

Rationale:
1. This project does not use a migration framework (no Flyway, Migrate, or db-migrate installed)
2. schema.sql is idempotent (all CREATE TABLE and CREATE INDEX use IF NOT EXISTS)
3. ALTER TABLE IF NOT EXISTS allows safe re-runs without errors
4. Aligns with existing pattern: simple schema file run at startup (or manually)
5. No data loss risk: DEFAULT 'Other' handles all existing rows

### Execution Flow
- On server startup, run schema.sql (already done via init script or migration tool if present)
- The ALTER TABLE adds the column if missing; existing rows get DEFAULT 'Other'
- All subsequent saves include niche from the async call

### Column Specification
- Name: `niche`
- Type: `VARCHAR(50)` (largest niche value: "Creator Economy" = 14 chars; 50 allows for future expansion)
- Default: `'Other'` (silent fallback on parse error, matches decision D-03)
- NULL-able: No (DEFAULT ensures never null)

---

## Claude Prompt Design for Niche Detection

### Challenge
With max_tokens=10, response must be a single word or short 2-word phrase. Claude must return exactly one niche from the list with zero preamble or explanation.

### Recommended System Prompt
```
You are a niche classifier for startup validation. Your task is to categorize a business idea into exactly one of these 7 niches:

1. Fintech
2. Logistics
3. Creator Economy
4. PropTech
5. HealthTech
6. EdTech
7. Other

Return ONLY the niche name from the list above. No preamble, no explanation, no additional text. If the idea doesn't clearly fit any of the first 6, return "Other".
```

### Recommended User Message
```
Idea: {idea_text}

Result summary:
{markdown_result}

Return the niche name only:
```

### Parse Strategy
1. **Trim and capitalize first letter of response**
   ```javascript
   let parsed = response.trim()
   // Handle common variations
   if (parsed.toLowerCase() === 'creator economy') parsed = 'Creator Economy'
   ```

2. **Validation list (case-insensitive)**
   ```javascript
   const VALID_NICHES = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'Other']
   const normalized = parsed
     .split(' ')
     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
     .join(' ')

   return VALID_NICHES.includes(normalized) ? normalized : 'Other'
   ```

3. **Fallback on any error**
   - If response is empty, return 'Other'
   - If response contains multiple lines, take first line
   - If parse fails (invalid niche), return 'Other'
   - **Never throw** — log error silently and use default

### Why This Works
- max_tokens=10 produces ~3-7 tokens (one 2-word niche ≈ 3 tokens)
- System prompt establishes hard constraint: "Return ONLY the niche name"
- User message ends with "Return the niche name only:" — reinforces instruction
- Case normalization handles "fintech", "FINTECH", "Fintech"
- Multi-line response handled by taking first line only

---

## Async Pattern Replication

### Current Pattern: generateAITitle (lines 49–66 in server/routes/history.js)

```javascript
async function generateAITitle(resultId, ideaText, userId) {
  const client = new Anthropic()
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      system: 'You are a naming expert. Generate a 3-4 word title for a startup idea. Return ONLY the title, no quotes or punctuation.',
      messages: [{ role: 'user', content: ideaText }],
    })
    const aiTitle = response.content[0].text.trim().substring(0, 100)
    await pool.query(
      'UPDATE saved_results SET title = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
      [aiTitle, resultId, userId]
    )
  } catch (err) {
    console.error('generateAITitle error:', err)
  }
}
```

### Recommended generateNiche Function (new, same pattern)

```javascript
async function generateNiche(resultId, ideaText, markdownResult, userId) {
  const client = new Anthropic()
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10,
      system: 'You are a niche classifier for startup validation. Your task is to categorize a business idea into exactly one of these 7 niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other. Return ONLY the niche name from the list above. No preamble, no explanation, no additional text. If the idea doesn\'t clearly fit any of the first 6, return "Other".',
      messages: [{ role: 'user', content: `Idea: ${ideaText}\n\nResult summary:\n${markdownResult}\n\nReturn the niche name only:` }],
    })

    // Parse response
    const VALID_NICHES = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'Other']
    let parsed = response.content[0].text.trim().split('\n')[0] // Take first line only

    // Normalize case for 2-word niches
    if (parsed.toLowerCase() === 'creator economy') {
      parsed = 'Creator Economy'
    } else {
      // Capitalize first letter of each word
      parsed = parsed.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }

    // Validate against list; default to 'Other' on mismatch
    const niche = VALID_NICHES.includes(parsed) ? parsed : 'Other'

    // Update database
    await pool.query(
      'UPDATE saved_results SET niche = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
      [niche, resultId, userId]
    )
  } catch (err) {
    console.error('generateNiche error:', err)
    // Silent failure: niche remains 'Other' (set by column DEFAULT)
  }
}
```

### Where to Call It
In `saveResultRoute` (lines 34–36), after `generateAITitle`:
```javascript
// Fire async title generation via Claude (non-blocking)
generateAITitle(result.id, idea_text, req.user.id).catch(err => {
  console.error('Title generation failed:', err)
})

// Fire async niche detection via Claude (non-blocking)
generateNiche(result.id, idea_text, markdown_result, req.user.id).catch(err => {
  console.error('Niche generation failed:', err)
})
```

### Structure Rationale
- **Same file (server/routes/history.js)** — both are fired from saveResultRoute, avoid creating a new file for a single 30-line function
- **Non-blocking (fire-and-forget)** — no await, call inside saveResultRoute but don't wait for response; client gets 201 immediately
- **Error handling** — catch silently, log to console, allow DB DEFAULT to handle fallback
- **Dependency order** — generateNiche receives markdown_result, so call must come after result is saved (which is already the case)

---

## Frontend Data Flow

### Redux State Changes
**historySlice.js** — No changes needed to slice structure. The `niche` field flows through as part of item objects, same as `title`, `idea_text`, `scores`.

Existing item structure:
```javascript
{
  id: UUID,
  title: string,
  idea_text: string,
  scores: { phase1, phase2, phase3, phase4, weighted },
  created_at: timestamp,
  // NEW:
  niche: string (e.g., 'Fintech', 'Other')
}
```

### API Response Changes

**saveResultRoute** (`POST /api/history`)
- Currently returns: `{ id, title, createdAt }`
- No change needed (niche is generated async, not returned immediately)

**listHistoryRoute** (`GET /api/history`)
- Currently SELECT: `id, title, idea_text, scores, created_at`
- **Change:** Add `niche` to SELECT clause
  ```sql
  SELECT id, title, idea_text, scores, created_at, niche
  FROM saved_results
  WHERE user_id = $1 AND deleted_at IS NULL
  ...
  ```
- Response items will include niche field (or 'Other' if NULL/not yet set)

**getResultRoute** (`GET /api/history/:id`)
- Currently SELECT: `id, user_id, title, idea_text, markdown_result, scores, created_at`
- **Change:** Add `niche` to SELECT clause
  ```sql
  SELECT id, user_id, title, idea_text, markdown_result, scores, created_at, niche
  FROM saved_results
  WHERE id = $1 AND deleted_at IS NULL
  ```
- Response will include niche field; consumed by ResultPage component

### Frontend State Flow
1. **HistoryPage** calls `GET /api/history` → reducer sets `history.items` (array of items with niche)
2. **HistoryCard** renders each item, accesses `item.niche` from Redux state
3. **ResultPage** calls `GET /api/history/:id` via `useHistoryResult` hook → result object includes niche
4. **ResultPage** renders niche pill using `result.niche` value

---

## Component Integration

### ResultPage.jsx — Standalone Niche Row

**Location:** Between IdeaSummaryCard and Scorecard (after line 143 in ResultPage.jsx)

**Current structure:**
```jsx
<div className="w-full max-w-2xl mb-12 flex flex-col gap-8">
  {sections?.ideaSummary && <IdeaSummaryCard markdown={sections.ideaSummary} />}

  {scores && (
    <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
      {/* Scorecard */}
    </Card>
  )}
```

**Proposed insertion (new lines after IdeaSummaryCard):**
```jsx
<div className="w-full max-w-2xl mb-12 flex flex-col gap-8">
  {sections?.ideaSummary && <IdeaSummaryCard markdown={sections.ideaSummary} />}

  {/* NEW: Niche pill row */}
  {result?.niche && (
    <div className="flex justify-center">
      <div
        className="inline-flex items-center px-4 py-2 font-body text-xs text-pencil"
        style={{
          backgroundColor: '#e5e0d8',
          border: '1px solid #2d2d2d',
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        }}
      >
        {result.niche}
      </div>
    </div>
  )}

  {scores && (
    <Card decoration="tack" rotate={1} className="w-full max-w-2xl mx-auto">
      {/* Scorecard */}
    </Card>
  )}
</div>
```

**Styling notes:**
- Muted background: `#e5e0d8` (matches Tailwind config `bg-muted`)
- Pencil border: `#2d2d2d` 1px (not 2px like verdict pill; more subtle)
- Font: Patrick Hand body (`font-body text-xs`), not heading
- Wobbly border-radius: standard form (255px 15px 225px 15px / 15px 225px 15px 255px)
- No shadow, no rotation (quiet, metadata feel)
- No emoji, text label only (e.g., "Fintech")

### HistoryCard.jsx — Footer Niche Pill

**Location:** Footer row (line 68–78), after verdict pill, before date

**Current structure:**
```jsx
<div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-4">
    <div className={`px-3 py-1 font-body text-xs rounded border ${getVerdictColor(weighted)}`}>
      {getVerdictLabel(weighted)} ({weighted}/5)
    </div>
    <span className="font-body text-xs text-pencil opacity-50">
      {createdDate}
    </span>
  </div>
```

**Proposed change (new niche pill in the flex gap-4):**
```jsx
<div className="flex items-center gap-4">
  {/* Verdict pill (unchanged) */}
  <div className={`px-3 py-1 font-body text-xs rounded border ${getVerdictColor(weighted)}`}>
    {getVerdictLabel(weighted)} ({weighted}/5)
  </div>

  {/* NEW: Niche pill (hidden on mobile) */}
  {item.niche && (
    <div className="hidden md:inline-flex px-3 py-1 font-body text-xs text-pencil border border-pencil rounded"
      style={{ backgroundColor: '#e5e0d8' }}>
      {item.niche}
    </div>
  )}

  {/* Date (unchanged) */}
  <span className="font-body text-xs text-pencil opacity-50">
    {createdDate}
  </span>
</div>
```

**Styling notes:**
- Same bg/border colors as ResultPage niche pill
- Inline with verdict pill (same row, same size)
- `hidden md:inline-flex` (hidden on mobile per D-17)
- Simpler border-radius: `rounded` (Tailwind default, more compact than wobbly)
- No emoji, text label only

### Other Components — No Changes Needed
- **IdeaSummaryCard.jsx** — No niche display
- **VerdictCard.jsx** — No niche display
- **CommentaryCard.jsx** — No niche display
- **Scorecard (in ResultPage.jsx)** — No niche display

---

## Validation Architecture

### Unit Tests (Recommended)

**File:** `server/routes/history.test.js` (create if not exists)

**Test suite for parseNiche logic:**
```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('Niche parsing', () => {
  it('parses exact niche names', () => {
    assert.equal(parseNiche('Fintech'), 'Fintech')
    assert.equal(parseNiche('Logistics'), 'Logistics')
    assert.equal(parseNiche('Creator Economy'), 'Creator Economy')
  })

  it('normalizes case variations', () => {
    assert.equal(parseNiche('fintech'), 'Fintech')
    assert.equal(parseNiche('CREATOR ECONOMY'), 'Creator Economy')
    assert.equal(parseNiche('proptech'), 'PropTech')
  })

  it('defaults to Other on invalid input', () => {
    assert.equal(parseNiche('Unknown Niche'), 'Other')
    assert.equal(parseNiche(''), 'Other')
    assert.equal(parseNiche('  '), 'Other')
  })

  it('handles first line only (ignores multiline)', () => {
    assert.equal(parseNiche('Fintech\nAdditional text'), 'Fintech')
  })

  it('trims whitespace', () => {
    assert.equal(parseNiche('  Fintech  '), 'Fintech')
  })
})
```

### Integration Test (Recommended)

**File:** `server/routes/history.test.js` (add to existing or create)

**Test for saveResultRoute async niche generation:**
```javascript
describe('saveResultRoute with niche generation', () => {
  it('saves result and fires niche detection async', async () => {
    // Setup: create user, mock Claude API
    const userId = 'test-user-uuid'
    const ideaText = 'AI-powered CRM for fintech ops'
    const markdownResult = '## Verdict\n Strong Signal'

    // Call saveResultRoute
    const response = await saveResultRoute({
      user: { id: userId },
      body: { idea_text: ideaText, markdown_result: markdownResult, scores: {} }
    }, mockRes)

    // Assert: result saved immediately
    assert.equal(response.status, 201)
    assert.ok(response.json.id)

    // Wait briefly for async niche generation
    await sleep(100)

    // Assert: niche updated in DB (query via pool.query)
    const { rows } = await pool.query(
      'SELECT niche FROM saved_results WHERE id = $1',
      [response.json.id]
    )
    assert.equal(rows[0].niche, 'Fintech')
  })
})
```

### E2E Test (Recommended)

**File:** `tests/e2e/niche-detection.spec.js` (create new)

**Test flow:**
1. User submits idea on /validate
2. Result page loads
3. Assert niche pill renders (with correct value or 'Other')
4. Navigate to /history/:id
5. Assert niche pill still renders in all views

```javascript
import { test, expect } from '@playwright/test'

test('niche detection displays on result page', async ({ page, context }) => {
  // Setup: login user
  await page.goto('/')
  // ... login flow ...

  // Submit validation
  await page.fill('textarea[placeholder="Paste your startup idea"]', 'FinTech AI for trading')
  await page.click('button:has-text("Validate")')

  // Wait for streaming to complete
  await page.waitForSelector('text=Strong Signal|Promising|Needs Work|Too Vague')

  // Assert niche pill renders (may be 'Other' or detected niche)
  const nichePill = page.locator('text=Fintech|Logistics|Creator Economy|PropTech|HealthTech|EdTech|Other')
  await expect(nichePill).toBeVisible()

  // Save result
  await page.click('button:has-text("Save")')

  // Navigate to history detail
  await page.goto('/history/:id') // or click from history
  await expect(page.locator('text=Fintech')).toBeVisible()
})

test('niche pill hidden on mobile in history cards', async ({ page, context }) => {
  // Setup: login, navigate to history
  await page.setViewportSize({ width: 375, height: 667 }) // mobile

  // Assert niche pill NOT visible on mobile
  const nichePill = page.locator('text=Fintech|Logistics|...')
  await expect(nichePill).not.toBeVisible()

  // Resize to desktop
  await page.setViewportSize({ width: 1280, height: 720 })

  // Assert niche pill NOW visible
  await expect(nichePill).toBeVisible()
})
```

### Coverage Target
- Unit: 100% of parseNiche logic (all branches: valid input, case variations, defaults)
- Integration: niche column updates correctly after async call
- E2E: niche displays on result and history pages; responsive behavior on mobile

---

## Key Risks & Edge Cases

### Risk 1: Async Race Condition (Low)
**Scenario:** User saves result, immediately navigates to /history/:id before niche is generated.

**Mitigation:** By design (D-06, D-07). Niche is absent during fresh validation; surfaces only on revisits. By the time user clicks "View result" from history, niche generation has likely completed (async call fires immediately after INSERT, typically <2s on modern hardware/network).

**If critical:** Add optional polling on /history/:id if niche is null, retry every 500ms up to 3s. But this adds complexity; current approach is acceptable.

### Risk 2: Parse Failure on Unusual Claude Response (Low)
**Scenario:** Claude returns "FINTECH" (all caps) or "finTech" or "Fin Tech" or something unexpected.

**Mitigation:** Case normalization logic and fallback to 'Other'. Test suite covers these variations.

### Risk 3: Database Column Already Exists in Production (Medium)
**Scenario:** If ALTER TABLE is re-run and column exists, IF NOT EXISTS prevents error.

**Mitigation:** Use ALTER TABLE IF NOT EXISTS ADD COLUMN IF NOT EXISTS — safe to run multiple times.

### Risk 4: Niche Null in Responses (Low)
**Scenario:** Older rows in DB have no niche column value (before this phase ships).

**Mitigation:** Column DEFAULT 'Other' handles all pre-existing rows. New rows always have niche set (either from async call or DEFAULT).

### Risk 5: API Contract Change (Medium)
**Scenario:** Existing clients expect /api/history to not have a niche field.

**Mitigation:** Adding a field to API response is backwards-compatible (JSON schema extends, not breaks). Frontend components check for `result?.niche` before rendering, so null/missing is safe.

### Risk 6: Token Limit Exceeded on Large Markdown (Low)
**Scenario:** markdown_result is very long (10k+ chars), pushing the API request over token limits.

**Mitigation:** Truncate markdown_result before sending to Claude:
```javascript
const truncatedResult = markdownResult.substring(0, 2000) // Keep first 2000 chars
```

### Risk 7: Dependency Order in saveResultRoute (Low)
**Scenario:** generateNiche is called before result is fully saved.

**Mitigation:** Current code structure: INSERT happens, then result.id is passed to generateAITitle and generateNiche. Order is safe. Both functions await pool.query with result.id, which is only valid after INSERT completes.

### Risk 8: Verdict vs. Niche Styling Confusion (Low)
**Scenario:** Niche pill looks too similar to verdict pill, UI feels cluttered.

**Mitigation:** Niche pill uses neutral muted bg + border (no color-coding). Verdict pill uses colored bg + emoji. Visually distinct.

---

## RESEARCH COMPLETE

### Next Steps (Planning Phase)
1. Extract parseNiche as a standalone utility function (server/utils/parseNiche.js)
2. Decide: extract generateAITitle + generateNiche to shared helper file or keep in history.js
3. Finalize column placement in schema.sql and confirm ALTER TABLE syntax
4. Design test fixtures and mocking strategy for Anthropic SDK calls
5. Plan component updates (ResultPage, HistoryCard) — coordinate with designer/PM on pill styling placement

### Implementation Checklist (for later)
- [ ] Add niche column to schema.sql
- [ ] Create generateNiche function in history.js
- [ ] Update saveResultRoute to call generateNiche
- [ ] Update listHistoryRoute to SELECT niche
- [ ] Update getResultRoute to SELECT niche
- [ ] Create NichePill component or inline styling in ResultPage
- [ ] Update HistoryCard to render niche pill in footer
- [ ] Write unit tests for parseNiche logic
- [ ] Write integration test for async niche save
- [ ] Write E2E tests for niche visibility
- [ ] Manual QA: test niche detection with 3–5 ideas across niches
- [ ] Verify mobile responsiveness (niche hidden on history cards)
- [ ] Test DB migration safety on staging with real data

---

*Research completed: 2026-03-22*
*Prepared for Phase 16 planning*
