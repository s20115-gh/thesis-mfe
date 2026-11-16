// One static server for every build we measure, so all configurations
// (monolith, F2, F4, F8, ...) are served with identical settings.
//
// Usage: node scripts/serve-static.mjs <dir>:<port> [<dir>:<port> ...]
// Example: node scripts/serve-static.mjs spike/shell/dist:5173 spike/remote/dist:5174
//
// Settings (keep these fixed during measurements):
//   - gzip compression on the fly (compression defaults)
//   - SPA fallback: unknown paths return index.html, so /remote works on reload
//   - CORS open to any origin, because the shell loads remotes from other ports
import compression from 'compression'
import http from 'node:http'
import path from 'node:path'
import sirv from 'sirv'

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('Usage: node scripts/serve-static.mjs <dir>:<port> [...]')
  process.exit(1)
}

const compress = compression()

for (const target of targets) {
  const i = target.lastIndexOf(':')
  const dir = path.resolve(target.slice(0, i))
  const port = Number(target.slice(i + 1))

  const serve = sirv(dir, { single: true, dev: false, etag: true })

  http
    .createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      compress(req, res, () =>
        serve(req, res, () => {
          res.statusCode = 404
          res.end('Not found')
        }),
      )
    })
    .on('error', (err) => {
      console.error(`Port ${port}: ${err.message}`)
      process.exit(1)
    })
    .listen(port, () => console.log(`http://localhost:${port}  ->  ${dir}`))
}
