import { test as base, expect } from '@playwright/test'

/**
 * `test` with one addition: every test fails if the page logs an error to
 * the console or throws, even when the assertions pass.
 */
export const test = base.extend<{ failOnConsoleErrors: void }>({
  failOnConsoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await use()
      expect(errors, 'errors in the browser console').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
