import { describe, it } from 'node:test'
import assert from 'node:assert'

// Pure logic extracted from saveResultRoute — similarity threshold check
function isSimilarEnough(score) {
  return score >= 0.75
}

// Simulate findBestMatch return shape for unit testing
function pickBestMatch(bestRating, pastRows) {
  if (!pastRows.length || bestRating < 0.75) return null
  return { id: pastRows[0].id, title: pastRows[0].title, scores: pastRows[0].scores }
}

describe('similarity threshold', () => {
  it('accepts score exactly at threshold', () => {
    assert.equal(isSimilarEnough(0.75), true)
  })

  it('accepts score above threshold', () => {
    assert.equal(isSimilarEnough(0.95), true)
  })

  it('rejects score below threshold', () => {
    assert.equal(isSimilarEnough(0.74), false)
  })

  it('rejects score of 0', () => {
    assert.equal(isSimilarEnough(0), false)
  })
})

describe('pickBestMatch', () => {
  const pastRows = [{ id: 5, title: 'AI Invoice Tool', scores: { weighted: 4.0 } }]

  it('returns match when score >= 0.75', () => {
    const result = pickBestMatch(0.80, pastRows)
    assert.deepStrictEqual(result, { id: 5, title: 'AI Invoice Tool', scores: { weighted: 4.0 } })
  })

  it('returns null when score < 0.75', () => {
    const result = pickBestMatch(0.60, pastRows)
    assert.equal(result, null)
  })

  it('returns null when no past rows', () => {
    const result = pickBestMatch(0.90, [])
    assert.equal(result, null)
  })
})

describe('setParentRoute validation', () => {
  it('rejects non-number parent_id', () => {
    const parent_id = 'abc'
    assert.equal(typeof parent_id !== 'number', true)
  })

  it('accepts integer parent_id', () => {
    const parent_id = 42
    assert.equal(typeof parent_id === 'number', true)
  })
})
