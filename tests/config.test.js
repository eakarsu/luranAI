const assert = require('node:assert/strict')
const test = require('node:test')

const { validateConfig } = require('../scripts/validate-config')

test('required configuration rejects missing, malformed, and placeholder values', () => {
  assert.deepEqual(
    validateConfig({ DATABASE_URL: '', JWT_SECRET: '' }),
    [
      'DATABASE_URL is required',
      'JWT_SECRET must be a non-placeholder secret of at least 32 characters',
    ]
  )
  assert.match(
    validateConfig({ DATABASE_URL: 'https://example.com', JWT_SECRET: 'x'.repeat(48) }).join(' '),
    /postgres/
  )
  assert.match(
    validateConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/luranai',
      JWT_SECRET: 'luranai-jwt-secret-key-2024',
    }).join(' '),
    /JWT_SECRET/
  )
})

test('required configuration accepts a Postgres URL and strong JWT secret', () => {
  assert.deepEqual(validateConfig({
    DATABASE_URL: 'postgresql://user:password@localhost:5432/luranai',
    JWT_SECRET: 'correct-horse-battery-staple-with-extra-entropy',
  }), [])
})
