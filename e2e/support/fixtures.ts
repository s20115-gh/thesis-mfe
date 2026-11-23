import { test as base, expect } from '@playwright/test'

type Fixtures = {
  /**
   * Allows console errors matching `pattern` in this test only. For errors a
   * test causes on purpose, e.g. the browser logging a request the server
   * rejected because the test set up a conflict.
   */
  allowConsoleError: (pattern: RegExp) => void
  allowedConsoleErrors: RegExp[]
  failOnConsoleErrors: void
}

/**
 * `test` with one addition: every test fails if the page logs an error to
 * the console or throws, even when the assertions pass, unless the test
 * allowed that error with `allowConsoleError`.
 */
export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures must destructure
  allowedConsoleErrors: async ({}, use) => {
    await use([])
  },

  allowConsoleError: async ({ allowedConsoleErrors }, use) => {
    await use((pattern) => allowedConsoleErrors.push(pattern))
  },

  failOnConsoleErrors: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await use()
      const unexpected = errors.filter(
        (error) => !allowedConsoleErrors.some((pattern) => pattern.test(error)),
      )
      expect(unexpected, 'errors in the browser console').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
