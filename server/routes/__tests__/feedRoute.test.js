// IMPORTANT: Load dotenv FIRST before any other imports
import 'dotenv/config'

import { describe, it } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import { app } from '../../index.js'

describe('GET /api/feed', () => {
  it('returns 200 with correct shape', async () => {
    const res = await request(app).get('/api/feed')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.hasOwnProperty('entries'))
    assert.ok(res.body.hasOwnProperty('total'))
    assert.ok(res.body.hasOwnProperty('page'))
    assert.strictEqual(res.body.page, 0)
    assert.ok(res.body.hasOwnProperty('hasMore'))
    assert.ok(Array.isArray(res.body.entries))
  })

  it('accepts page query param', async () => {
    const res = await request(app).get('/api/feed?page=0')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.page, 0)
  })

  it('returns entries with required fields', async () => {
    const res = await request(app).get('/api/feed')
    assert.strictEqual(res.status, 200)
    if (res.body.entries.length > 0) {
      const entry = res.body.entries[0]
      assert.ok(entry.hasOwnProperty('id'))
      assert.ok(entry.hasOwnProperty('idea_text'))
      assert.ok(entry.hasOwnProperty('scores'))
      assert.ok(entry.hasOwnProperty('niche'))
      assert.ok(entry.hasOwnProperty('user_id'))
      assert.ok(entry.hasOwnProperty('author_username'))
      assert.ok(entry.hasOwnProperty('created_at'))
      assert.ok(entry.hasOwnProperty('like_count'))
      assert.ok(entry.hasOwnProperty('comment_count'))
    }
  })

  it('handles logged-out request without error', async () => {
    const res = await request(app).get('/api/feed')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.hasOwnProperty('entries'))
  })
})
