import { expect, test, type Page } from '@playwright/test'

function contentSet(unitId: number, chapterId: number, title: string, html: string) {
  return {
    id: unitId,
    title,
    unit: [
      {
        id: unitId,
        name: `${title} collection`,
        contents: [{ id: chapterId, name: title, content: html }],
      },
    ],
  }
}

async function acceptConsent(page: Page): Promise<void> {
  const agree = page.locator('.consent-agree')
  if (await agree.isVisible()) await agree.click()
}

test('adds slides from different resources to a chosen deck', async ({ page }) => {
  await page.route('**/LaoBible.json', (route) =>
    route.fulfill({
      json: contentSet(
        2,
        1,
        'Genesis 1',
        '<p class="bible-verse"><sup>1</sup> In the beginning</p>',
      ),
    }),
  )
  await page.route('**/LaoSongs.json', (route) =>
    route.fulfill({
      json: contentSet(
        143,
        2524,
        'Song 1',
        '<p class="song-line">Praise together</p><p class="song-line">Amen</p>',
      ),
    }),
  )

  await page.goto('/present/1/2/1')
  await acceptConsent(page)
  await expect(page.locator('.slide-canvas .deck-canvas')).toBeVisible()

  const targetDeck = page.getByLabel(/ຊຸດສະໄລ້ເປົ້າໝາຍ|Target deck/)
  const addSelected = page.getByRole('button', {
    name: /ເພີ່ມສະໄລ້ທີ່ເລືອກໃສ່ຊຸດທີ່ເລືອກ|Add selected slides to the chosen deck/,
  })
  await expect(targetDeck).toHaveValue('__new-deck__')
  await expect(addSelected).toBeEnabled()
  await addSelected.click()

  await expect(targetDeck).not.toHaveValue('__new-deck__')
  const deckId = await targetDeck.inputValue()
  await expect(page.getByRole('link', { name: /ເປີດຊຸດ|Open deck/ })).toBeVisible()

  await page.goto('/present/2/143/2524')
  await expect(page.locator('.slide-canvas .deck-canvas')).toBeVisible()
  await expect(targetDeck).toHaveValue(deckId)
  await addSelected.click()
  await page.getByRole('link', { name: /ເປີດຊຸດ|Open deck/ }).click()

  await expect(page).toHaveURL(new RegExp(`/decks/${deckId}$`))
  const slideNames = page.locator('.studio-slide-name')
  await expect(slideNames.filter({ hasText: 'Genesis 1' }).first()).toBeVisible()
  await expect(slideNames.filter({ hasText: 'Song 1' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'ZIP' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'PPTX' })).toBeVisible()
})

test('switches the active deck before removing a slide', async ({ page }) => {
  await page.goto('/decks')
  await acceptConsent(page)
  await page.getByRole('button', { name: /ຊຸດໃໝ່|New deck/ }).click()
  await expect(page).toHaveURL(/\/decks\/[\w-]+$/)
  const firstDeckId = new URL(page.url()).pathname.split('/').pop()!
  await page.getByLabel(/ຊື່ດາດຟ້າ|Deck name/).fill('First deck')
  await page.getByLabel(/ຊື່ດາດຟ້າ|Deck name/).blur()

  await page.goto('/decks')
  await page.getByRole('button', { name: /ຊຸດໃໝ່|New deck/ }).click()
  await expect(page).toHaveURL(/\/decks\/[\w-]+$/)
  const secondDeckId = new URL(page.url()).pathname.split('/').pop()!
  await page.getByLabel(/ຊື່ດາດຟ້າ|Deck name/).fill('Second deck')
  await page.getByLabel(/ຊື່ດາດຟ້າ|Deck name/).blur()

  const deckPicker = page.getByLabel(/ເລືອກຊຸດສະໄລ້|Choose deck/)
  await expect(deckPicker).toHaveValue(secondDeckId)
  await deckPicker.selectOption(firstDeckId)
  await expect(page).toHaveURL(new RegExp(`/decks/${firstDeckId}$`))
  await page.getByRole('button', { name: /ລຶບສະໄລ້|Delete slide/ }).click()
  await expect(page.locator('.studio-slide-item')).toHaveCount(0)

  await deckPicker.selectOption(secondDeckId)
  await expect(page).toHaveURL(new RegExp(`/decks/${secondDeckId}$`))
  await expect(page.locator('.studio-slide-item')).toHaveCount(1)
})
