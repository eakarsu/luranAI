#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

function required(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function main() {
  const email = required('PROVISION_ADMIN_EMAIL').toLowerCase()
  const password = required('PROVISION_ADMIN_PASSWORD')
  const name = required('PROVISION_ADMIN_NAME')
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('PROVISION_ADMIN_PASSWORD must contain at least 12 characters with upper-case, lower-case, and numeric characters')
  }
  const prisma = new PrismaClient()
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.upsert({
      where: { email },
      update: { name, password: passwordHash, role: 'admin' },
      create: { email, name, password: passwordHash, role: 'admin' },
    })
    console.log('Configured administrator is ready')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 })
