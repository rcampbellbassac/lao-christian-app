import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
}

async function acceptConsent(page: Page): Promise<void> {
  const agree = page.locator('.consent-agree')
  if (await agree.isVisible()) await agree.click()
}

test('navigation adapts without horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/')
  await acceptConsent(page)
  await expectNoHorizontalOverflow(page)

  if (testInfo.project.name.startsWith('desktop')) {
    await expect(page.locator('.desktop-toolbar')).toBeVisible()
    await expect(page.locator('.mobile-bottom-nav')).toBeHidden()
    await expect(page.locator('.desktop-toolbar a', { hasText: 'ໜ້າຫຼັກ' })).toBeVisible()
  } else {
    const bottomNav = page.locator('.mobile-bottom-nav')
    await expect(bottomNav).toBeVisible()
    const targets = await bottomNav.locator('.mobile-nav-item').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return { width: rect.width, height: rect.height }
      }),
    )
    for (const target of targets) {
      expect(target.width).toBeGreaterThanOrEqual(44)
      expect(target.height).toBeGreaterThanOrEqual(44)
    }

    await bottomNav.locator('button').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('link', { name: /ການຕັ້ງຄ່າ/ })).toBeVisible()
  }
})

test('My Study remains usable at the real emulated viewport', async ({ page }) => {
  await page.goto('/study')
  await acceptConsent(page)
  await expect(page.locator('.study-tools')).toBeVisible()
  await expect(page.locator('.study-search')).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
