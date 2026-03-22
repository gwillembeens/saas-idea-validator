import { test, expect } from '@playwright/test'

const TEST_IDEA = 'A SaaS tool that helps real estate agents automatically generate property listings from photos using AI, saving 2 hours per listing'

const MOCK_USER = {
  accessToken: 'test-access-token',
  user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
}

// Mock auth so the frontend allows validation without a real login session
async function mockAuth(page) {
  await page.route('/api/auth/refresh', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
  )
}

async function submitIdea(page) {
  const textarea = page.locator('textarea').first()
  await textarea.fill(TEST_IDEA)
  const submitBtn = page.locator('button').filter({ hasText: /Validate Idea/i }).first()
  await submitBtn.click()
}

test.describe('Split-Card Results Layout', () => {

  test('1. Validation flow completes and result page loads', async ({ page }) => {
    await mockAuth(page)
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Idea Summary|Scorecard/i').first()).toBeVisible({ timeout: 90000 })
  })

  test('2. All 4 result cards are visible after validation', async ({ page }) => {
    await mockAuth(page)
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Idea Summary/i').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Commentary/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('3. Scorecard shows all 4 phase labels', async ({ page }) => {
    await mockAuth(page)
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('text=/Market.*Niche/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Content.*Distribution/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Product.*Agent/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Pricing.*Moat/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('4. Scorecard weighted total is numeric (1.0-5.0 range)', async ({ page }) => {
    await mockAuth(page)
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 90000 })
    // Weighted total is rendered as "X.X/5" text next to "Weighted Total" label
    const weightedText = await page.locator('text=/Weighted Total/i').first().evaluate(el => {
      // The score is in a sibling span
      return el.closest('div')?.textContent || ''
    })
    const match = weightedText.match(/([\d.]+)\/5/)
    expect(match).not.toBeNull()
    const val = parseFloat(match[1])
    expect(val).toBeGreaterThanOrEqual(1.0)
    expect(val).toBeLessThanOrEqual(5.0)
    // 4 phase rows rendered (each has ScoreBar circles)
    const phaseRows = page.locator('.flex.gap-2')
    await expect(phaseRows).toHaveCount(4, { timeout: 5000 })
  })

  test('5. Verdict badge is visible', async ({ page }) => {
    await mockAuth(page)
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible({ timeout: 90000 })
    const bodyText = await page.locator('body').textContent()
    const hasVerdict = /Strong Signal|Promising|Needs Work|Too Vague/.test(bodyText)
    expect(hasVerdict).toBe(true)
  })

  test('6. Desktop layout (1280px): all cards visible and readable', async ({ page }) => {
    await mockAuth(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 90000 })
    await page.screenshot({ path: 'test-results/desktop-1280.png', fullPage: true })
    await expect(page.locator('text=/Market.*Niche/i').first()).toBeVisible()
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible()
  })

  test('7. Mobile layout (375px): all cards visible and readable', async ({ page }) => {
    await mockAuth(page)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await submitIdea(page)
    await expect(page.locator('text=/Scorecard/i').first()).toBeVisible({ timeout: 90000 })
    await page.screenshot({ path: 'test-results/mobile-375.png', fullPage: true })
    await expect(page.locator('text=/Market.*Niche/i').first()).toBeVisible()
    await expect(page.locator('text=/Verdict/i').first()).toBeVisible()
  })

  test('8. Page uses Patrick Hand font', async ({ page }) => {
    await page.goto('/')
    const fontLink = page.locator('link[href*="Patrick+Hand"]')
    const count = await fontLink.count()
    expect(count).toBeGreaterThan(0)
  })
})
