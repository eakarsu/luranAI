# Outbound Vapi workflow acceptance contract

This is the one executable workflow closed by the 2026-07-20 completeness pass.
It plans a bounded outbound-call batch, optionally executes it through Vapi, and
optionally records a tenant-scoped Contact after the provider returns a call ID.

## Invariants

1. Planning is offline. It does not read env files, require API keys, connect to
   Postgres, create audit data, or send a network request.
2. Live execution requires three independent inputs: `--execute`,
   `--confirm-live-calls`, and an allowed `--consent-basis` label.
3. Phone input must be a valid 10-digit US number or `+`-prefixed international
   number with 8–15 digits. Normalized duplicates are removed, a run has at most
   25 unique targets, and calls are created sequentially.
4. Provider POSTs are never retried automatically because a retry could create a
   duplicate call. Requests have bounded timeouts; status polling has a bounded
   deadline and stops the batch on uncertain state.
5. Every live request, provider result/failure, lead result, notification
   failure, and terminal/polling result is appended and fsynced to a mode-`0600`
   JSONL file. Provider error text is bounded and credential-like values are
   redacted. The file is operational evidence, not immutable compliance proof.
6. Lead persistence requires `--org-id`, verifies that organization exists,
   searches only within that tenant, records the consent label and Vapi call ID,
   and treats the call marker idempotently. Existing status/source/tags are not
   destructively replaced.
7. A call-provider response without an ID, a database failure after call
   creation, or a polling timeout stops later calls and gives the operator a call
   ID when one exists for reconciliation.

## Verification

`npm test` exercises strict CLI parsing, E.164 validation, deduplication, live
confirmation and consent requirements, tenant requirements, batch limits,
credential-free dry-run behavior, private JSONL output, provider-error
redaction, idempotent tenant-scoped lead updates, configuration validation, and
repository safety guards.

`npm run check` adds TypeScript and Prisma schema validation. CI performs those
checks from a clean install and then builds the Next.js application.

## Explicit non-goals and blockers

- The consent label is an operator assertion, not proof of consent or legal
  advice. Suppression-list and jurisdiction policy enforcement remain external.
- The script cannot safely infer whether a timed-out provider POST created a
  call, so it stops rather than retrying. Verify/cancel in Vapi before rerunning.
- Notification failure does not undo a valid call or lead; it is recorded for
  operator follow-up.
- Local audit JSONL is not tamper-proof, and provider-side cancellation is not
  automated in this slice.
- Web-app callback authentication, durable call jobs, recording retention, and
  full multi-tenant route enforcement remain launch blockers in `SECURITY.md`.
