import { describe, it } from 'node:test'
import assert from 'node:assert'
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
  it('returns { topScores } array with HTTP 200', () => {
    // TODO: implement
  })

  it('returns exactly 8 entries — one per VALID_NICHE', () => {
    // TODO: implement
  })

  it('score field contains MAX weighted score for that niche from public non-deleted results', () => {
    // TODO: implement
  })

  it('niches with no public entries return score: null, count: 0', () => {
    // TODO: implement
  })

  it('excludes private validations (is_public=false)', () => {
    // TODO: implement
  })

  it('excludes soft-deleted validations (deleted_at IS NOT NULL)', () => {
    // TODO: implement
  })
})
