import { deleteBookings, idFromUrl } from '../support/db.ts'
import { expect, test } from '../support/fixtures.ts'
import { signedOut, users } from '../support/users.ts'

/**
 * The customer journey from the thesis proposal, written as one test:
 *   search salons in Nairobi -> open a venue -> book a slot -> mock checkout.
 * The benchmark runs this same journey, so it only uses what a user can see.
 * It starts signed out and signs in when booking asks for it.
 *
 * Seed: 30 venues in Nairobi (supabase/seed.sql). The booking it creates is
 * deleted afterwards. It books ~5 days ahead, a day the other booking specs
 * do not use.
 */
test.use({ storageState: signedOut })

const created: string[] = []
test.afterEach(async () => {
  await deleteBookings(created.splice(0))
})

test('customer: search Nairobi, open a venue, book a slot, pay', async ({ page }) => {
  await test.step('open the app', async () => {
    await page.goto('/')
    await expect(page).toHaveURL('/salons')
    await expect(page.getByRole('heading', { name: 'Find a salon' })).toBeVisible()
  })

  await test.step('search for salons in Nairobi', async () => {
    await page.getByLabel('City').selectOption('Nairobi')

    await expect(page).toHaveURL('/salons?city=Nairobi')
    await expect(page.getByTestId('result-count')).toHaveText('30 salons in Nairobi')
    await expect(page.locator('.is-refreshing')).toHaveCount(0)

    const cards = page.getByTestId('venue-card')
    await expect(cards).toHaveCount(30)
    for (const card of await cards.all()) await expect(card).toContainText('Nairobi')
  })

  const venueName = await test.step('open the top result', async () => {
    const first = page.getByTestId('venue-card').first()
    const name = await first.getByRole('heading').innerText()
    await first.click()
    return name
  })

  await test.step('see the venue profile', async () => {
    await expect(page).toHaveURL(/\/venues\/[a-z0-9-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(venueName)
    await expect(page.getByText(/Nairobi$/).first()).toBeVisible()

    const services = page.getByTestId('service-row')
    await expect(services.first()).toBeVisible()
    await expect(services.getByRole('link', { name: /^Book / })).toHaveCount(await services.count())
    await expect(page.getByTestId('staff-row').first()).toBeVisible()
  })

  await test.step('browser back returns to the same search', async () => {
    await page.goBack()
    await expect(page).toHaveURL('/salons?city=Nairobi')
    await expect(page.getByLabel('City')).toHaveValue('Nairobi')
    await expect(page.getByTestId('result-count')).toHaveText('30 salons in Nairobi')
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(venueName)
  })

  const serviceName = await test.step('choose a service to book', async () => {
    const row = page.getByTestId('service-row').first()
    const name = await row.locator('strong').innerText()
    await row.getByRole('link', { name: `Book ${name}` }).click()
    return name
  })

  await test.step('sign in when asked', async () => {
    await expect(page).toHaveURL('/sign-in')
    await page.getByLabel('Email').fill(users.customer.email)
    await page.getByLabel('Password').fill(users.customer.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('heading', { name: `Book at ${venueName}` })).toBeVisible()
  })

  const when = await test.step('book a slot', async () => {
    await expect(
      page.getByRole('group', { name: 'Service' }).getByRole('button', { pressed: true }),
    ).toContainText(serviceName)
    const day = page
      .getByRole('group', { name: 'Day' })
      .getByRole('button', { disabled: false })
      .nth(5)
    await day.click()
    await expect(day).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('group', { name: 'Time' }).getByRole('button').first().click()
    const summary = await page.getByTestId('summary-when').innerText()
    await page.getByRole('button', { name: 'Confirm booking' }).click()
    await expect(page).toHaveURL(/\/checkout\/[0-9a-f-]{36}$/)
    created.push(idFromUrl(page.url()))
    return summary
  })

  await test.step('mock checkout', async () => {
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
    await expect(page.getByTestId('booking-when')).toHaveText(when)
    await page.getByRole('button', { name: /^Pay Ksh/ }).click()
  })

  await test.step('see the confirmation', async () => {
    await expect(page).toHaveURL(/\/checkout\/[0-9a-f-]{36}\/confirmed$/)
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible()
    await expect(page.getByText(`See you at ${venueName}.`)).toBeVisible()
    await expect(page.getByTestId('payment-ref')).toHaveText(/^mock_/)
  })
})
