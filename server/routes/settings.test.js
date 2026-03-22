import { describe, it } from 'node:test'
import assert from 'node:assert'

// Username validation logic extracted for unit testing
function validateUsername(username) {
  if (typeof username !== 'string') return 'username must be a string'
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())) {
    return 'username must be 3–30 characters, letters/numbers/underscore/hyphen only'
  }
  return null
}

// Display name validation
function validateDisplayName(display_name) {
  if (typeof display_name !== 'string') return 'display_name must be a string'
  if (display_name.trim().length > 100) return 'display_name must be 100 characters or fewer'
  return null
}

// Chain building logic
function buildChains(validations) {
  const publicIds = new Set(validations.map(v => v.id))
  const childrenMap = {}
  for (const v of validations) {
    if (v.parent_id && publicIds.has(v.parent_id)) {
      if (!childrenMap[v.parent_id]) childrenMap[v.parent_id] = []
      childrenMap[v.parent_id].push(v)
    }
  }
  const roots = validations.filter(v => !v.parent_id || !publicIds.has(v.parent_id))
  return roots.map(root => {
    const chain = [root]
    let current = root
    while (childrenMap[current.id]?.length) {
      current = childrenMap[current.id][0]
      chain.push(current)
    }
    return chain.length >= 2 ? chain : null
  }).filter(Boolean)
}

describe('username validation', () => {
  it('accepts valid username', () => assert.equal(validateUsername('john_doe'), null))
  it('accepts username with hyphens', () => assert.equal(validateUsername('john-doe'), null))
  it('rejects username too short', () => assert.ok(validateUsername('ab')))
  it('rejects username with spaces', () => assert.ok(validateUsername('john doe')))
  it('rejects username with special chars', () => assert.ok(validateUsername('john@doe')))
})

describe('display_name validation', () => {
  it('accepts valid display name', () => assert.equal(validateDisplayName('John Doe'), null))
  it('accepts empty string', () => assert.equal(validateDisplayName(''), null))
  it('rejects non-string', () => assert.ok(validateDisplayName(123)))
  it('rejects name over 100 chars', () => assert.ok(validateDisplayName('a'.repeat(101))))
})

describe('buildChains', () => {
  it('returns empty array when no validations', () => {
    assert.deepStrictEqual(buildChains([]), [])
  })

  it('returns empty array when no chains (all roots, no children)', () => {
    const validations = [
      { id: 1, parent_id: null, scores: { weighted: 3.5 } },
      { id: 2, parent_id: null, scores: { weighted: 4.0 } },
    ]
    assert.deepStrictEqual(buildChains(validations), [])
  })

  it('builds a simple 2-version chain', () => {
    const validations = [
      { id: 1, parent_id: null, scores: { weighted: 3.5 } },
      { id: 2, parent_id: 1, scores: { weighted: 4.0 } },
    ]
    const chains = buildChains(validations)
    assert.equal(chains.length, 1)
    assert.equal(chains[0].length, 2)
    assert.equal(chains[0][0].id, 1)
    assert.equal(chains[0][1].id, 2)
  })

  it('builds a 3-version chain', () => {
    const validations = [
      { id: 1, parent_id: null, scores: { weighted: 3.0 } },
      { id: 2, parent_id: 1, scores: { weighted: 3.5 } },
      { id: 3, parent_id: 2, scores: { weighted: 4.0 } },
    ]
    const chains = buildChains(validations)
    assert.equal(chains.length, 1)
    assert.equal(chains[0].length, 3)
  })
})
