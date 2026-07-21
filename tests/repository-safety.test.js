const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const test = require('node:test')

const root = path.resolve(__dirname, '..')

test('secret-bearing file types are not tracked', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .trim()
    .split('\n')
  const forbidden = tracked.filter((file) => (
    /(^|\/)\.env($|\.)/.test(file) && file !== '.env.example'
  ) || /\.(key|pem|p12|pfx)$/.test(file))
  assert.deepEqual(forbidden, [])
})

test('startup does not kill processes, install packages, mutate schema, or seed data', () => {
  const startup = fs.readFileSync(path.join(root, 'start.sh'), 'utf8')
  assert.doesNotMatch(startup, /kill\s+-9|npm\s+install|accept-data-loss|prisma\s+db\s+(push|seed)/)
  assert.match(startup, /already in use/)
})

test('authentication source contains no accepted fallback secret', () => {
  const auth = fs.readFileSync(path.join(root, 'src/lib/auth.ts'), 'utf8')
  assert.doesNotMatch(auth, /process\.env\.JWT_SECRET\s*\|\|/)
  assert.match(auth, /length < 32/)
  assert.match(auth, /algorithms: \['HS256'\]/)
})
