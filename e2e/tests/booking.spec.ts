import type { Page } from '@playwright/test'
import { admin, deleteBookings, idFromUrl } from '../support/db.ts'
import { expect, test } from '../support/fixtures.ts'
import { users } from '../support/users.ts'

// These tests create bookings, so they run one at a time and delete what
// they create. Seed: Amani Hair Studio is closed on Sundays; "Silk press"
// costs Ksh 3,500 and takes 1 h 30 min.

test.describe.configure({ mode: 'serial' })
test.use({ storageState: users.customer.storageState })

const created: string[] = []
test.afterEach(async () => {
  await deleteBookings(created.splice(0))
})

async function openFromVenue(page: Page, service = 'Silk press') {
  await page.goto('/venues/amani-hair-studio')
  await page.getByRole('link', { name: `Book ${service}` }).click()
  await expect(page.getByRole('heading', { name: 'Book at Amani Hair Studio' })).toBeVisible()
}

/** An open day a few days ahead, so "now" never removes its morning slots. */
async function pickOpenDay(page: Page) {
  const button = page
    .getByRole('group', { name: 'Day' })
    .getByRole('button', { disabled: false })
    .nth(3)
  const day = (await button.getAttribute('data-day'))!
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  return day
}

test('pick a slot and create a pending booking', async ({ page }) => {
  await openFromVenue(page)
  await expect(
    page.getByRole('group', { name: 'Service' }).getByRole('button', { pressed: true }),
  ).toContainText('Silk press')
  await expect(page.getByRole('group', { name: 'Day' }).getByRole('button')).toHaveCount(14)

  const day = await pickOpenDay(page)
  await expect(page).toHaveURL(new RegExp(`day=${day}`))

  const times = page.getByRole('group', { name: 'Time' }).getByRole('button')
  await expect(times.first()).toBeVisible()
  const time = await times.first().innerText()
  await times.first().click()

  await expect(page.getByTestId('summary-when')).toContainText(time)
  await expect(page.getByTestId('summary-staff')).not.toHaveText('Anyone')
  await page.getByRole('button', { name: 'Confirm booking' }).click()

  await expect(page).toHaveURL(/\/checkout\/[0-9a-f-]{36}$/)
  const bookingId = idFromUrl(page.url())
  created.push(bookingId)

  const { data: booking } = await admin
    .from('bookings')
    .select('status, customer_id, price_cents, starts_at, ends_at, services(name)')
    .eq('id', bookingId)
    .single()
  expect(booking?.status).toBe('pending')
  expect(booking?.services?.name).toBe('Silk press')
  expect(booking?.price_cents).toBe(350_000)
  const minutes = (Date.parse(booking!.ends_at) - Date.parse(booking!.starts_at)) / 60_000
  expect(minutes).toBe(90)
  const { data: customer } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', booking!.customer_id)
    .single()
  expect(customer?.full_name).toBe(users.customer.name)
})

test('the booked time disappears for that staff member', async ({ page }) => {
  await openFromVenue(page)
  await pickOpenDay(page)
  await page.getByRole('group', { name: 'Staff' }).getByRole('button').nth(1).click() // first named staff
  const times = page.getByRole('group', { name: 'Time' }).getByRole('button')
  const time = await times.first().innerText()
  await times.first().click()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page).toHaveURL(/\/checkout\//)
  created.push(idFromUrl(page.url()))

  await page.goBack()
  await expect(
    page.getByRole('group', { name: 'Time' }).getByRole('button', { name: time, exact: true }),
  ).toHaveCount(0)
})

test('choices live in the URL; closed days cannot be picked', async ({ page }) => {
  await openFromVenue(page)
  const day = await pickOpenDay(page)
  await page
    .getByRole('group', { name: 'Service' })
    .getByRole('button', { name: /Cornrows/ })
    .click()
  await expect(page).toHaveURL(new RegExp(`service=[0-9a-f-]{36}.*day=${day}`))

  await page.reload()
  await expect(
    page.getByRole('group', { name: 'Service' }).getByRole('button', { pressed: true }),
  ).toContainText('Cornrows')
  await expect(
    page.getByRole('group', { name: 'Day' }).locator('[aria-pressed=true]'),
  ).toHaveAttribute('data-day', day)

  const sundays = page
    .getByRole('group', { name: 'Day' })
    .getByRole('button', { name: /^Sunday.*closed$/ })
  await expect(sundays.first()).toBeDisabled()
})

test('a time taken by someone else meanwhile gives a clear message', async ({
  page,
  allowConsoleError,
}) => {
  // The browser logs the rejected create_booking request; that is the point.
  allowConsoleError(/Failed to load resource: the server responded with a status of 4\d\d/)

  await openFromVenue(page)
  await pickOpenDay(page)
  await page.getByRole('group', { name: 'Staff' }).getByRole('button').nth(1).click()
  const first = page.getByRole('group', { name: 'Time' }).getByRole('button').first()
  const time = await first.innerText()
  await first.click()

  // Another customer books the same staff member at that time first.
  const url = new URL(page.url())
  const staffId = url.searchParams.get('staff')!
  const serviceId = url.searchParams.get('service')!
  const { data: slots } = await admin.rpc('get_available_slots', {
    p_service_id: serviceId,
    p_day: url.searchParams.get('day')!,
  })
  const slot = slots!.find((s) => s.staff_id === staffId)!
  const { data: other } = await admin
    .from('bookings')
    .insert({
      customer_id: (
        await admin.from('profiles').select('id').eq('full_name', 'Brian Otieno').single()
      ).data!.id,
      service_id: serviceId,
      staff_id: staffId,
      starts_at: slot.starts_at,
      venue_id: '00000000-0000-0000-0000-000000000000',
      ends_at: slot.starts_at,
      price_cents: 0,
    })
    .select('id')
    .single()
  created.push(other!.id)

  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page.getByRole('alert')).toHaveText('That time was just taken. Please pick another.')
  await expect(page).toHaveURL(/\/book\//)
  await expect(
    page.getByRole('group', { name: 'Time' }).getByRole('button', { name: time, exact: true }),
  ).toHaveCount(0)
})

test('without a service in the URL, choose one first', async ({ page }) => {
  await page.goto('/venues/amani-hair-studio')
  const href = (await page
    .getByRole('link', { name: /^Book / })
    .first()
    .getAttribute('href'))!
  await page.goto(href.split('?')[0]!)
  await expect(page.getByText('Choose a service to see free times.')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Day' })).toHaveCount(0)
})

test('unknown venue shows "Salon not found"', async ({ page }) => {
  await page.goto('/book/00000000-0000-0000-0000-000000000000')
  await expect(page.getByRole('heading', { name: 'Salon not found' })).toBeVisible()
})
