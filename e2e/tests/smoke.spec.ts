import { expect, test } from '../support/fixtures.ts'
import { signedOut, users, type Role } from '../support/users.ts'

/**
 * Smoke test: every feature route renders its feature, for a user who is
 * allowed to see it, without console errors. URLs are the only thing this
 * test knows about the app, so it runs unchanged against every configuration.
 */
const routes: { feature: string; path: string; as: Role | 'anonymous' }[] = [
  { feature: 'discovery', path: '/salons', as: 'anonymous' },
  { feature: 'venue', path: '/venues', as: 'anonymous' },
  { feature: 'booking', path: '/book', as: 'customer' },
  { feature: 'checkout', path: '/checkout', as: 'customer' },
  { feature: 'account', path: '/account', as: 'customer' },
  { feature: 'calendar', path: '/merchant/calendar', as: 'merchant' },
  { feature: 'catalog-staff', path: '/merchant/catalog', as: 'merchant' },
  { feature: 'analytics', path: '/merchant/analytics', as: 'merchant' },
]

for (const route of routes) {
  test.describe(`${route.feature} (${route.as})`, () => {
    test.use({
      storageState: route.as === 'anonymous' ? signedOut : users[route.as].storageState,
    })

    test(`renders at ${route.path}`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.getByTestId(`feature-${route.feature}`)).toBeVisible()
      await expect(page).toHaveURL(route.path)
    })
  })
}

test.describe('signed out', () => {
  test.use({ storageState: signedOut })

  for (const route of routes.filter((r) => r.as !== 'anonymous')) {
    test(`${route.path} redirects to sign-in`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page).toHaveURL('/sign-in')
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })
  }
})
