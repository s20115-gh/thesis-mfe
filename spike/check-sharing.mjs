// Spike check: does the remote reuse the shell's libraries and QueryClient?
// Needs both builds served first:  pnpm spike:build && pnpm spike:serve
// Run:                             node spike/check-sharing.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SHELL = 'http://localhost:5173'
const REMOTE_PORT = '5174'
const here = path.dirname(fileURLToPath(import.meta.url))

// Library copies the remote bundles as a fallback, in case no host provides
// them. If sharing works, the browser never downloads any of these.
const remoteFallbacks = fs
  .readdirSync(path.join(here, 'remote/dist/assets'))
  .filter((f) => f.includes('__prebuild__') || /^react(-dom)?-/.test(f))

const browser = await chromium.launch()
const page = await browser.newPage()
const files = []
const pageErrors = []
page.on('pageerror', (err) => pageErrors.push(err.message.split('\n')[0]))
page.on('response', async (res) => {
  const url = new URL(res.url())
  if (!url.pathname.endsWith('.js')) return
  const body = await res.text().catch(() => '')
  files.push({ port: url.port, name: path.basename(url.pathname), bytes: body.length, body })
})

// Same path as a real user: open the shell, then click through to the remote.
await page.goto(SHELL + '/')
await page.getByRole('link', { name: 'Remote page' }).click()
const remote = page.locator('section', { hasText: 'Hello from the remote app' })
try {
  await remote.waitFor({ timeout: 10_000 })
} catch {
  console.log('FAIL  The remote never appeared on the page')
  for (const e of pageErrors) console.log(`      browser error: ${e}`)
  await browser.close()
  process.exit(1)
}
await page.waitForLoadState('networkidle')
await remote.getByRole('button').click()

const text = await remote.innerText()
const reactCopies = files.filter((f) =>
  /__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE\s*=/.test(f.body),
)
const fallbacksLoaded = files.filter((f) => f.port === REMOTE_PORT && remoteFallbacks.includes(f.name))
const fromRemote = files.filter((f) => f.port === REMOTE_PORT)

const checks = [
  ['Exactly one copy of React downloaded', reactCopies.length === 1,
    reactCopies.map((f) => `:${f.port} ${f.name}`).join(', ')],
  ['No shared-library fallback downloaded from the remote', fallbacksLoaded.length === 0,
    fallbacksLoaded.map((f) => f.name).join(', ') || `${remoteFallbacks.length} fallback files skipped`],
  ["Remote reads the shell's QueryClient", text.includes('seeded by the shell'),
    text.match(/react-query: (.*)/)?.[1]],
  ["Remote uses the shell's router", text.includes('current path is /remote'), ''],
  ['React hooks work inside the remote', text.includes('clicked 1 times'), ''],
]

console.log(`\nJS downloaded from the remote (:${REMOTE_PORT}):`)
for (const f of fromRemote) console.log(`  ${String(f.bytes).padStart(7)} B  ${f.name}`)
console.log(`  ${String(fromRemote.reduce((s, f) => s + f.bytes, 0)).padStart(7)} B  total\n`)
for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)

await browser.close()
process.exit(checks.every(([, ok]) => ok) ? 0 : 1)
