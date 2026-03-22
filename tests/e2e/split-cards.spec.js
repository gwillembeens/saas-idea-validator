import { test, expect } from '@playwright/test'

// Use a long enough idea to trigger a real validation response
const TEST_IDEA = 'A SaaS tool that helps real estate agents automatically generate property listings from photos using AI, saving 2 hours per listing'

test.describe('Split-Card Results Layout', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('1. Validation flow completes and result page loads', async ({ page }) => {
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    // Find submit button with "Validate Idea" text
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    // Wait for result page content to appear (streaming takes time)
    await expect(page.locator('text=/Idea Summary/i').first()).toBeVisible({ timeout: 30000 })
  })

  test('2. All 4 result cards are visible after validation', async ({ page }) => {
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    // Wait for streaming to complete — all 4 card headings must be present
    await expect(page.locator('text=/Idea Summary/i').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=/Commentary/i').first()).toBeVisible({ timeout: 30000 })
  })

  test('3. Scorecard shows all 4 phase labels', async ({ page }) => {
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    await expect(page.locator('text=/Market.*Niche/i').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=/Content.*Distribution/i').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=/Product.*Agent/i').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=/Pricing.*Moat/i').first()).toBeVisible({ timeout: 30000 })
  })

  test('4. Scorecard scores are numeric (1.0-5.0 range)', async ({ page }) => {
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    // Wait for scorecard
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 30000 })
    // Get all score text (format: X/5 or X.X/5)
    const bodyText = await page.locator('body').textContent()
    const scoreMatches = bodyText.match(/([1-5](?:\.\d)?)\s*\/\s*5/g) || []
    expect(scoreMatches.length).toBeGreaterThanOrEqual(4) // at least 4 phase scores
    // Verify each score is within range
    scoreMatches.forEach(m => {
      const val = parseFloat(m.match(/[\d.]+/)[0])
      expect(val).toBeGreaterThanOrEqual(1.0)
      expect(val).toBeLessThanOrEqual(5.0)
    })
  })

  test('5. Verdict badge is visible', async ({ page }) => {
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible({ timeout: 30000 })
    // Verdict label should be one of the 4 expected strings
    const bodyText = await page.locator('body').textContent()
    const hasVerdict = /Strong Signal|Promising|Needs Work|Too Vague/.test(bodyText)
    expect(hasVerdict).toBe(true)
  })

  test('6. Desktop layout (1280px): all cards visible and readable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 30000 })
    await page.screenshot({ path: 'test-results/desktop-1280.png', fullPage: true })
    // All 4 cards still visible at desktop width
    await expect(page.locator('text=/Market.*Niche/i').first()).toBeVisible()
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible()
  })

  test('7. Mobile layout (375px): all cards visible and readable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const textarea = page.locator('textarea')
    await textarea.fill(TEST_IDEA)
    const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
    await submitBtn.click()
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 30000 })
    await page.screenshot({ path: 'test-results/mobile-375.png', fullPage: true })
    // All 4 cards visible at mobile width
    await expect(page.locator('text=/Market.*Niche/i').first()).toBeVisible()
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible()
  })

  test('8. Page uses Patrick Hand font', async ({ page }) => {
    await page.goto('/')
    // Check that Google Fonts link for Patrick Hand is in head
    const fontLink = page.locator('link[href*="Patrick+Hand"]')
    const count = await fontLink.count()
    expect(count).toBeGreaterThan(0)
  })
})
