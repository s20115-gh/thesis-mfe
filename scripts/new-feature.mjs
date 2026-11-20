// Creates a feature package from templates/feature.
//
// Usage: node scripts/new-feature.mjs <name> "<Title>" <customer|merchant>
// Example: node scripts/new-feature.mjs discovery "Discovery" customer
//
// Copies every file, drops the .tmpl suffix and replaces __NAME__, __TITLE__
// and __SIDE__. Run `pnpm install` afterwards to link the new package.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [name, title, side] = process.argv.slice(2)
if (!name || !title || !['customer', 'merchant'].includes(side)) {
  console.error('Usage: node scripts/new-feature.mjs <name> "<Title>" <customer|merchant>')
  process.exit(1)
}
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`Feature name must be lowercase kebab-case, got "${name}"`)
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templateDir = path.join(root, 'templates/feature')
const targetDir = path.join(root, 'packages/features', name)
if (fs.existsSync(targetDir)) {
  console.error(`${path.relative(root, targetDir)} already exists`)
  process.exit(1)
}

const fill = (text) =>
  text.replaceAll('__NAME__', name).replaceAll('__TITLE__', title).replaceAll('__SIDE__', side)

for (const entry of fs.readdirSync(templateDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue
  const source = path.join(entry.parentPath, entry.name)
  const target = path.join(targetDir, path.relative(templateDir, source)).replace(/\.tmpl$/, '')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, fill(fs.readFileSync(source, 'utf8')))
}
console.log(`Created ${path.relative(root, targetDir)} (@thesis/feature-${name})`)
