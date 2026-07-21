const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

const {
  MAX_LIVE_TARGETS,
  appendAuditEvent,
  buildPlan,
  createOrUpdateLocalLead,
  parseArgs,
  providerErrorSummary,
  toE164,
} = require('../scripts/vapi-outbound-sequence')

test('strict CLI parsing rejects unknown and missing-value options', () => {
  const args = parseArgs([
    'node', 'script', '--sector', 'dentistry', '--phones', '8043601129',
    '--execute', '--confirm-live-calls', '--consent-basis', 'express',
  ])
  assert.equal(args.sector, 'dentistry')
  assert.equal(args.confirmLiveCalls, true)
  assert.throws(() => parseArgs(['node', 'script', '--sector']), /requires a value/)
  assert.throws(() => parseArgs(['node', 'script', '--surprise']), /Unknown option/)
})

test('phone normalization is strict E.164 and dry-run plans are deduplicated', () => {
  assert.equal(toE164('(804) 360-1129'), '+18043601129')
  assert.equal(toE164('+44 20 7946 0958'), '+442079460958')
  assert.throws(() => toE164('call-me'), /Invalid phone number/)
  assert.throws(() => toE164('12345'), /Use a 10-digit US number/)

  const plan = buildPlan({
    sector: 'dentistry',
    phones: '8043601129,+1 (804) 360-1129',
    execute: false,
  })
  assert.deepEqual(plan.phones, ['+18043601129'])
})

test('live plans require confirmation, consent provenance, tenant scope, and a bounded batch', () => {
  const base = { sector: 'dentistry', phones: '8043601129', execute: true }
  assert.throws(() => buildPlan(base), /--confirm-live-calls/)
  assert.throws(
    () => buildPlan({ ...base, confirmLiveCalls: true }),
    /--consent-basis/
  )
  assert.throws(
    () => buildPlan({
      ...base,
      confirmLiveCalls: true,
      consentBasis: 'express',
      createLead: true,
    }),
    /--org-id/
  )

  const tooMany = Array.from(
    { length: MAX_LIVE_TARGETS + 1 },
    (_, index) => String(8045550000 + index)
  ).join(',')
  assert.throws(
    () => buildPlan({ ...base, phones: tooMany, confirmLiveCalls: true, consentBasis: 'express' }),
    /limited to/
  )
})

test('dry run succeeds without credentials and creates no audit data', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luranai-dry-run-'))
  try {
    const script = path.resolve(__dirname, '../scripts/vapi-outbound-sequence.js')
    const result = spawnSync(
      process.execPath,
      [script, '--sector', 'dentistry', '--phones', '8043601129'],
      { cwd: root, env: { PATH: process.env.PATH }, encoding: 'utf8' }
    )
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Offline dry run only/)
    assert.equal(fs.existsSync(path.join(root, 'data')), false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('operational audit events are valid JSONL and private on POSIX', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luranai-audit-'))
  try {
    const auditFile = path.join(root, 'audit', 'events.jsonl')
    appendAuditEvent(auditFile, { event: 'call_requested', runId: 'run-1' })
    const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n')
    assert.equal(lines.length, 1)
    assert.equal(JSON.parse(lines[0]).event, 'call_requested')
    if (process.platform !== 'win32') {
      assert.equal(fs.statSync(auditFile).mode & 0o777, 0o600)
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('provider errors redact credentials', () => {
  const summary = providerErrorSummary('authorization: Bearer abcdef123456 token=supersecret')
  assert.doesNotMatch(summary, /abcdef123456|supersecret/)
  assert.match(summary, /redacted/)
})

test('lead persistence is tenant-scoped, idempotent by call, and preserves existing status', async () => {
  let updateData
  const existing = {
    id: 'contact-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    company: 'Example',
    email: 'ada@example.com',
    industry: 'technology',
    source: 'referral',
    status: 'customer',
    tags: ['customer'],
    notes: 'Existing note',
  }
  const database = {
    organization: { findUnique: async ({ where }) => where.id === 'org-1' ? { id: 'org-1' } : null },
    contact: {
      findFirst: async ({ where }) => {
        assert.deepEqual(where, { phone: '+18043601129', orgId: 'org-1' })
        return existing
      },
      update: async ({ data }) => {
        updateData = data
        return { ...existing, ...data }
      },
    },
  }

  const result = await createOrUpdateLocalLead({
    orgId: 'org-1',
    phone: '+18043601129',
    callId: 'call-1',
    consentBasis: 'express',
    sector: 'dentistry',
  }, database)
  assert.equal(result.created, false)
  assert.equal(Object.hasOwn(updateData, 'status'), false)
  assert.deepEqual(updateData.tags, ['customer', 'vapi-outbound', 'dentistry'])
  assert.match(updateData.notes, /\[vapi-call:call-1\]/)
  assert.match(updateData.notes, /Consent basis: express/)

  let updated = false
  database.contact.findFirst = async () => ({ ...existing, notes: '[vapi-call:call-1]' })
  database.contact.update = async () => { updated = true }
  const repeated = await createOrUpdateLocalLead({
    orgId: 'org-1',
    phone: '+18043601129',
    callId: 'call-1',
    consentBasis: 'express',
    sector: 'dentistry',
  }, database)
  assert.equal(repeated.idempotent, true)
  assert.equal(updated, false)
})
