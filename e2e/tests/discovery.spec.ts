import { expect, test } from '../support/fixtures.ts'
import { signedOut } from '../support/users.ts'

// Expected numbers come from supabase/seed.sql (36 venues: 30 Nairobi,
// 3 Mombasa, 3 Kisumu; 9 hair salons in Nairobi).

test.use({ storageState: signedOut })

const cards = (page: import('@playwright/test').Page) => page.getByTestId('venue-card')
const count = (page: import('@playwright/test').Page) => page.getByTestId('result-count')

test('search Nairobi hair salons through the form; the search goes into the URL', async ({
  page,
}) => {
  await page.goto('/salons')
  await expect(count(page)).toHaveText('36 salons')

  await page.getByLabel('City').selectOption('Nairobi')
  await page.getByLabel('Service type').selectOption('hair')

  await expect(page).toHaveURL('/salons?city=Nairobi&category=hair')
  await expect(count(page)).toHaveText('9 salons in Nairobi')
  await expect(cards(page)).toHaveCount(9)
  for (const card of await cards(page).all()) {
    await expect(card).toContainText('Nairobi')
    await expect(card).toContainText('Hair')
  }
})

test('opening a search URL directly shows that search (shareable, reload-safe)', async ({
  page,
}) => {
  await page.goto('/salons?city=Mombasa')
  await expect(page.getByLabel('City')).toHaveValue('Mombasa')
  await expect(count(page)).toHaveText('3 salons in Mombasa')

  await page.reload()
  await expect(count(page)).toHaveText('3 salons in Mombasa')
})

test('text search matches venue names and service names', async ({ page }) => {
  await page.goto('/salons')
  await page.getByLabel('Salon or service').fill('silk press')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL('/salons?q=silk+press')
  // "Silk Press Studio" by name, other hair salons by their "Silk press" service.
  await expect(cards(page).filter({ hasText: 'Silk Press Studio' })).toHaveCount(1)
  await expect(cards(page)).not.toHaveCount(1)
})

/** Waits until the results on screen belong to the current URL. */
async function settled(page: import('@playwright/test').Page, expectedCount: string) {
  await expect(count(page)).toHaveText(expectedCount)
  await expect(page.locator('.is-refreshing')).toHaveCount(0)
}

test('rating filter and price sort', async ({ page }) => {
  await page.goto('/salons?city=Nairobi')
  await settled(page, '30 salons in Nairobi')

  await page.getByLabel('Rating').selectOption('4.5')
  await expect(page).toHaveURL('/salons?city=Nairobi&rating=4.5')
  await settled(page, '13 salons in Nairobi')
  const ratings = await page.locator('.rating').allInnerTexts()
  expect(ratings).toHaveLength(13)
  for (const rating of ratings) {
    expect(parseFloat(rating.replace('★', ''))).toBeGreaterThanOrEqual(4.5)
  }

  await page.getByLabel('Sort by').selectOption('price')
  await expect(page).toHaveURL('/salons?city=Nairobi&rating=4.5&sort=price')
  await settled(page, '13 salons in Nairobi')
  const prices = (await page.getByTestId('venue-price').allInnerTexts()).map((t) =>
    Number(t.replace(/[^\d]/g, '')),
  )
  expect(prices.length).toBeGreaterThan(1)
  expect(prices).toEqual([...prices].sort((a, b) => a - b))
})

test('back button returns to the previous search', async ({ page }) => {
  await page.goto('/salons?city=Nairobi')
  await page.getByLabel('Service type').selectOption('barber')
  await expect(page).toHaveURL('/salons?city=Nairobi&category=barber')

  await page.goBack()
  await expect(page).toHaveURL('/salons?city=Nairobi')
  await expect(page.getByLabel('Service type')).toHaveValue('')
  await expect(count(page)).toHaveText('30 salons in Nairobi')
})

test('no results shows an empty state that clears the search', async ({ page }) => {
  await page.goto('/salons?q=zzzz-nothing')
  await expect(page.getByText('No salons match this search.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page).toHaveURL('/salons')
  await expect(count(page)).toHaveText('36 salons')
})

test('invalid URL values are ignored, not fatal', async ({ page }) => {
  await page.goto('/salons?category=not-a-category&rating=99&sort=bogus')
  await expect(count(page)).toHaveText('36 salons')
})

test('a result links to the venue profile by URL', async ({ page }) => {
  await page.goto('/salons?city=Nairobi&category=hair&q=Amani')
  await cards(page).filter({ hasText: 'Amani Hair Studio' }).click()
  await expect(page).toHaveURL('/venues/amani-hair-studio')
})
