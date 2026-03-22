import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseNiche } from './history.js'

describe('parseNiche', () => {
  it('parses exact niche names', () => {
    for (const niche of ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'Other']) {
      assert.equal(parseNiche(niche), niche)
    }
  })

  it('normalizes case variations', () => {
    assert.equal(parseNiche('fintech'), 'Fintech')
    assert.equal(parseNiche('LOGISTICS'), 'Logistics')
    assert.equal(parseNiche('proptech'), 'PropTech')
    assert.equal(parseNiche('creator economy'), 'Creator Economy')
  })

  it('defaults to Other on invalid input', () => {
    assert.equal(parseNiche(''), 'Other')
    assert.equal(parseNiche(null), 'Other')
    assert.equal(parseNiche('   '), 'Other')
    assert.equal(parseNiche('InvalidNiche'), 'Other')
  })

  it('handles multiline response (takes first line)', () => {
    assert.equal(parseNiche('Fintech\nSome other text'), 'Fintech')
    assert.equal(parseNiche('HealthTech\nMore info'), 'HealthTech')
  })

  it('trims whitespace', () => {
    assert.equal(parseNiche('  Fintech  '), 'Fintech')
    assert.equal(parseNiche('\t EdTech \n'), 'EdTech')
  })
})

describe('generateNiche integration', () => {
  it.todo('niche column updated after async call')
})
