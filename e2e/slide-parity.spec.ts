import { expect, test, type Locator } from '@playwright/test'

async function typographyRatio(canvas: Locator): Promise<number> {
  return canvas.evaluate((element) => {
    const width = element.getBoundingClientRect().width
    const body = element.querySelector<HTMLElement>('.deck-body')
    if (!body || !width) throw new Error('Rendered slide body is unavailable')
    return Number.parseFloat(getComputedStyle(body).fontSize) / width
  })
}

test('Slide Studio and audience use the same container-relative typography', async ({ page }) => {
  await page.goto('/decks')
  const agree = page.locator('.consent-agree')
  if (await agree.isVisible()) await agree.click()
  await page.locator('.studio-primary').first().click()
  await expect(page).toHaveURL(/\/decks\/[\w-]+$/)

  const title = page.getByLabel(/ຫົວຂໍ້ສະໄລ້|Slide title/)
  const body = page.getByLabel(/ຂໍ້ຄວາມສະໄລ້|Slide text/)
  await title.fill('Typography parity')
  await title.blur()
  await body.fill('ພຣະຄຳຂອງພຣະເຈົ້າ')
  await body.blur()

  const preview = page.locator('.studio-slide-preview .deck-canvas')
  await expect(preview).toBeVisible()
  const previewRatio = await typographyRatio(preview)
  expect(previewRatio).toBeCloseTo(0.0225, 3)

  const deckId = new URL(page.url()).pathname.split('/').pop()
  await page.goto(`/audience/${deckId}`)
  const audience = page.locator('.audience-shell .deck-canvas')
  await expect(audience).toBeVisible()
  const audienceRatio = await typographyRatio(audience)

  expect(audienceRatio).toBeCloseTo(previewRatio, 4)
})
