import { expect, test } from '../support/fixtures.ts'
import { signedOut, users } from '../support/users.ts'

// Expected values from supabase/seed.sql: Amani Hair Studio (venue 1) offers
// 4 hair services, has 4 staff, and is closed on Sundays.

const uuid = '[0-9a-f-]{36}'

test.describe('signed out', () => {
  test.use({ storageState: signedOut })

  test('shows venue details, services cheapest first, team and hours', async ({ page }) => {
    await page.goto('/venues/amani-hair-studio')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Amani Hair Studio')
    await expect(page.getByText('Westlands, Nairobi').first()).toBeVisible()
    await expect(page.getByLabel(/Rated \d\.\d out of 5/)).toBeVisible()

    const services = page.getByTestId('service-row')
    await expect(services).toHaveCount(4)
    await expect(services.first()).toContainText('Wash & blow-dry')
    const prices = (await services.locator('.price').allInnerTexts()).map((t) =>
      Number(t.replace(/[^\d]/g, '')),
    )
    expect(prices).toEqual([...prices].sort((a, b) => a - b))

    await expect(page.getByTestId('staff-row')).toHaveCount(4)
    const hours = page.getByRole('region', { name: 'Opening hours' })
    await expect(hours).toContainText('Monday')
    await expect(hours.locator('dd').last()).toHaveText('Closed') // Sunday
  })

  test('each service has a Book link to /book/:venueId?service=:serviceId', async ({ page }) => {
    await page.goto('/venues/amani-hair-studio')
    const links = page.getByRole('link', { name: /^Book / })
    await expect(links).toHaveCount(4)
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      expect(href).toMatch(new RegExp(`^/book/${uuid}\\?service=${uuid}$`))
    }
  })

  test('Book while signed out: sign in, then continue to the booking URL', async ({ page }) => {
    await page.goto('/venues/amani-hair-studio')
    const book = page.getByRole('link', { name: 'Book Silk press' })
    const href = await book.getAttribute('href')
    await book.click()

    await expect(page).toHaveURL('/sign-in')
    await page.getByLabel('Email').fill(users.customer.email)
    await page.getByLabel('Password').fill(users.customer.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(href!) // query string kept
  })

  test('from a search result to the venue page', async ({ page }) => {
    await page.goto('/salons?city=Nairobi&category=barber')
    await page.getByTestId('venue-card').filter({ hasText: 'Kilimani Cuts' }).click()
    await expect(page).toHaveURL('/venues/kilimani-cuts')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kilimani Cuts')
    await expect(page.getByTestId('service-row').first()).toBeVisible()
  })

  test('unknown venue shows "Salon not found"', async ({ page }) => {
    await page.goto('/venues/no-such-salon')
    await expect(page.getByRole('heading', { name: 'Salon not found' })).toBeVisible()
  })

  test('/venues on its own redirects to the search', async ({ page }) => {
    await page.goto('/venues')
    await expect(page).toHaveURL('/salons')
  })
})
