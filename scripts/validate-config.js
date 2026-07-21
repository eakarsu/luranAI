#!/usr/bin/env node

const fs = require('node:fs')

const REJECTED_JWT_SECRETS = new Set([
  'default-secret',
  'luranai-jwt-secret-key-2024',
  'your-jwt-secret-here',
])

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return values
}

function resolvedEnvironment(environment = process.env) {
  return {
    ...readEnvFile('.env'),
    ...readEnvFile('.env.local'),
    ...environment,
  }
}

function validateConfig(environment) {
  const env = resolvedEnvironment(environment)
  const errors = []
  const databaseUrl = env.DATABASE_URL?.trim()
  const jwtSecret = env.JWT_SECRET?.trim()

  if (!databaseUrl) {
    errors.push('DATABASE_URL is required')
  } else {
    try {
      const parsed = new URL(databaseUrl)
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
        errors.push('DATABASE_URL must use postgres:// or postgresql://')
      }
    } catch {
      errors.push('DATABASE_URL must be a valid URL')
    }
  }

  if (!jwtSecret || jwtSecret.length < 32 || REJECTED_JWT_SECRETS.has(jwtSecret)) {
    errors.push('JWT_SECRET must be a non-placeholder secret of at least 32 characters')
  }

  return errors
}

if (require.main === module) {
  const errors = validateConfig(process.env)
  if (errors.length > 0) {
    console.error('Configuration validation failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
  } else {
    console.log('Required configuration is present; secret values were not printed.')
  }
}

module.exports = { readEnvFile, resolvedEnvironment, validateConfig }
