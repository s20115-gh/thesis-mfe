import { admin, createPendingBooking, deleteBookings } from '../support/db.ts'
import { expect, test } from '../support/fixtures.ts'
import { users } from '../support/users.ts'

// Creates its own bookings 9+ days ahead (booking.spec uses ~3 days ahead,
// the customer journey ~5), and deletes them afterwards.

test.describe.configure({ mode: 'serial' })
test.use({ storageState: users.customer.storageState })

const created: string[] = []
test.afterEach(async () => {
  await deleteBookings(created.splice(0))
})

test('pay for a pending booking and see the confirmation', async ({ page }) => {
  const booking = await createPendingBooking(9)
  created.push(booking.id)

  await page.goto(`/checkout/${booking.id}`)
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
  await expect(page.getByText('Amani Hair Studio')).toBeVisible()
  await expect(page.getByText('Wash & blow-dry')).toBeVisible()
  await expect(page.getByTestId('total')).toHaveText('Ksh 1,500')

  await page.getByRole('button', { name: 'Pay Ksh 1,500' }).click()

  await expect(page).toHaveURL(`/checkout/${booking.id}/confirmed`)
  await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible()
  await expect(page.getByTestId('paid')).toHaveText('Ksh 1,500')
  await expect(page.getByTestId('payment-ref')).toHaveText(/^mock_[0-9a-f]{32}$/)

  const { data } = await admin
    .from('bookings')
    .select('status, payments(status, amount_cents, provider)')
    .eq('id', booking.id)
    .single()
  expect(data?.status).toBe('confirmed')
  expect(data?.payments).toMatchObject({
    status: 'succeeded',
    amount_cents: 150_000,
    provider: 'mock',
  })

  // The confirmation survives a reload, and checkout for a paid booking
  // goes straight to it.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible()
  await page.goto(`/checkout/${booking.id}`)
  await expect(page).toHaveURL(`/checkout/${booking.id}/confirmed`)

  await page.getByRole('main').getByRole('link', { name: 'My bookings' }).click()
  await expect(page).toHaveURL('/account')
})

test('confirmation for an unpaid booking goes back to checkout', async ({ page }) => {
  const booking = await createPendingBooking(10)
  created.push(booking.id)
  await page.goto(`/checkout/${booking.id}/confirmed`)
  await expect(page).toHaveURL(`/checkout/${booking.id}`)
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
})

test('paid in another tab meanwhile: shows the confirmation, no double payment', async ({
  page,
  allowConsoleError,
}) => {
  // The browser logs the rejected second payment request; that is expected.
  allowConsoleError(/Failed to load resource: the server responded with a status of 4\d\d/)
  const booking = await createPendingBooking(11)
  created.push(booking.id)
  await page.goto(`/checkout/${booking.id}`)
  await expect(page.getByRole('button', { name: /^Pay / })).toBeVisible()

  // "Another tab" pays first.
  await admin.from('payments').insert({
    booking_id: booking.id,
    amount_cents: booking.price_cents,
    status: 'succeeded',
    provider_ref: 'mock_othertab',
  })
  await admin.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id)

  await page.getByRole('button', { name: /^Pay / }).click()
  await expect(page).toHaveURL(`/checkout/${booking.id}/confirmed`)
  await expect(page.getByTestId('payment-ref')).toHaveText('mock_othertab')
  const { count } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', booking.id)
  expect(count).toBe(1)
})

test('a cancelled booking cannot be paid', async ({ page }) => {
  const booking = await createPendingBooking(12, 'cancelled')
  created.push(booking.id)
  await page.goto(`/checkout/${booking.id}`)
  await expect(page.getByRole('heading', { name: 'This booking can’t be paid' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0)
})

test("someone else's booking is not found", async ({ page }) => {
  const { data } = await admin
    .from('bookings')
    .select('id, profiles!inner(full_name)')
    .eq('profiles.full_name', 'Brian Otieno')
    .limit(1)
    .single()
  await page.goto(`/checkout/${data!.id}`)
  await expect(page.getByRole('heading', { name: 'Booking not found' })).toBeVisible()
})

test('a malformed booking id is not found', async ({ page }) => {
  await page.goto('/checkout/not-a-booking')
  await expect(page.getByRole('heading', { name: 'Booking not found' })).toBeVisible()
})
