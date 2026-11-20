import { expect, test as setup } from '@playwright/test'
import { users } from '../support/users.ts'

// Sign each test account in once through the real sign-in page and save the
// browser state (the Supabase session lives in localStorage). Tests then
// start already signed in.
for (const user of Object.values(users)) {
  setup(`sign in as ${user.email}`, async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByTestId('user-name')).toHaveText(user.name)
    await page.context().storageState({ path: user.storageState })
  })
}
