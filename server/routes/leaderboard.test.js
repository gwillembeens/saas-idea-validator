// IMPORTANT: Load dotenv FIRST before any other imports
import 'dotenv/config'

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import { v4 as uuid } from 'uuid'
import { pool } from '../db/init.js'
import { app } from '../index.js'
import { VALID_NICHES, truncateIdeaText } from './leaderboard.js'

describe('VALID_NICHES', () => {
  it('includes all 8 expected niches', () => {
    const expected = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'HRTech', 'Other']
    assert.deepStrictEqual(VALID_NICHES, expected)
  })

  it('rejects invalid niche names', () => {
    assert.equal(VALID_NICHES.includes('InvalidNiche'), false)
    assert.equal(VALID_NICHES.includes(''), false)
  })

  it('accepts All as special case (not in VALID_NICHES — handled by route logic)', () => {
    assert.equal(VALID_NICHES.includes('All'), false)
  })
})

describe('truncateIdeaText', () => {
  it('returns text unchanged when under 150 chars', () => {
    const short = 'A short idea.'
    assert.equal(truncateIdeaText(short), short)
  })

  it('truncates text to 150 chars plus ellipsis', () => {
    const long = 'A'.repeat(200)
    assert.equal(truncateIdeaText(long).length, 151) // 150 + ellipsis
  })

  it('replaces newlines with spaces', () => {
    const text = 'Line one\nLine two\nLine three'
    assert.equal(truncateIdeaText(text).includes('\n'), false)
    assert.equal(truncateIdeaText(text), 'Line one Line two Line three')
  })

  it('handles empty string', () => {
    assert.equal(truncateIdeaText(''), '')
  })
})

describe('GET /api/leaderboard/top-per-niche', () => {
  const TEST_MARKER = 'test-idea-for-leaderboard-tests'
  const testUserIds = []

  // Test helper: create a test user
  async function createTestUser() {
    const userId = uuid()
    await pool.query(`
      INSERT INTO users (id, email, username)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, [userId, `test-${uuid()}@example.com`, `testuser-${uuid()}`])
    testUserIds.push(userId)
    return userId
  }

  // Test helper: create a saved result
  async function createSavedResult(userId, niche, isPublic, deletedAt, weightedScore) {
    const resultId = uuid()
    const scores = {
      phase1: 3,
      phase2: 3,
      phase3: 3,
      phase4: 3,
      weighted: weightedScore || 3.0,
    }
    await pool.query(`
      INSERT INTO saved_results (id, user_id, title, idea_text, markdown_result, scores, niche, is_public, deleted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [resultId, userId, TEST_MARKER, TEST_MARKER, '# Result', JSON.stringify(scores), niche, isPublic, deletedAt])
    return resultId
  }

  // Clean up test data
  async function cleanupTestData() {
    // Delete test results by marker
    await pool.query(`DELETE FROM saved_results WHERE title = $1`, [TEST_MARKER])
    // Delete test users
    for (const userId of testUserIds) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId])
    }
    testUserIds.length = 0
  }

  before(async () => {
    await cleanupTestData()
  })

  after(async () => {
    await cleanupTestData()
  })

  it('returns { topScores } array with HTTP 200', async () => {
    const res = await request(app).get('/api/leaderboard/top-per-niche')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.hasOwnProperty('topScores'))
    assert.ok(Array.isArray(res.body.topScores))
  })

  it('returns exactly 8 entries — one per VALID_NICHE', async () => {
    const res = await request(app).get('/api/leaderboard/top-per-niche')
    assert.strictEqual(res.body.topScores.length, 8)
    const niches = res.body.topScores.map(n => n.niche)
    assert.ok(niches.includes('Fintech'))
    assert.ok(niches.includes('Logistics'))
    assert.ok(niches.includes('Creator Economy'))
    assert.ok(niches.includes('PropTech'))
    assert.ok(niches.includes('HealthTech'))
    assert.ok(niches.includes('EdTech'))
    assert.ok(niches.includes('HRTech'))
    assert.ok(niches.includes('Other'))
  })

  it('score field contains MAX weighted score for that niche from public non-deleted results', async () => {
    await cleanupTestData() // Clean before test
    const userId = await createTestUser()
    // Create 2 public Fintech results with different scores
    await createSavedResult(userId, 'Fintech', true, null, 3.5)
    await createSavedResult(userId, 'Fintech', true, null, 4.8)

    const res = await request(app).get('/api/leaderboard/top-per-niche')
    const fintechEntry = res.body.topScores.find(n => n.niche === 'Fintech')
    assert.strictEqual(fintechEntry.score, 4.8)
    await cleanupTestData() // Clean after test
  })

  it('niches with no public entries return score: null, count: 0', async () => {
    await cleanupTestData() // Clean before test

    const res = await request(app).get('/api/leaderboard/top-per-niche')
    // Verify that all entries have the correct structure
    for (const entry of res.body.topScores) {
      assert.ok(typeof entry.niche === 'string')
      assert.ok(typeof entry.count === 'number')
      assert.ok(entry.score === null || typeof entry.score === 'number')
      // When count is 0, score must be null
      if (entry.count === 0) {
        assert.strictEqual(entry.score, null)
      }
    }
  })

  it('excludes private validations (is_public=false)', async () => {
    await cleanupTestData() // Clean before test
    const userId = await createTestUser()
    // Create 1 private HRTech result with high score (use HRTech to avoid interference)
    await createSavedResult(userId, 'HRTech', false, null, 5.0)
    // Create 1 public HRTech result with lower score
    await createSavedResult(userId, 'HRTech', true, null, 3.5)

    const res = await request(app).get('/api/leaderboard/top-per-niche')
    const hrtechEntry = res.body.topScores.find(n => n.niche === 'HRTech')
    // Should be 3.5, not 5.0 (the private one was excluded)
    assert.strictEqual(hrtechEntry.score, 3.5)
    await cleanupTestData() // Clean after test
  })

  it('excludes soft-deleted validations (deleted_at IS NOT NULL)', async () => {
    await cleanupTestData() // Clean before test
    const userId = await createTestUser()
    // Create 1 soft-deleted EdTech result with high score (use EdTech to avoid interference)
    await createSavedResult(userId, 'EdTech', true, new Date(), 5.0)
    // Create 1 public non-deleted EdTech result with lower score
    await createSavedResult(userId, 'EdTech', true, null, 3.5)

    const res = await request(app).get('/api/leaderboard/top-per-niche')
    const edtechEntry = res.body.topScores.find(n => n.niche === 'EdTech')
    // Should be 3.5, not 5.0 (the deleted one was excluded)
    assert.strictEqual(edtechEntry.score, 3.5)
    await cleanupTestData() // Clean after test
  })
})
