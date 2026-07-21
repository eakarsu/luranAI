# Security status

LuranAI is not ready for an internet-facing production deployment. The
2026-07-20 completeness pass establishes fail-closed browser API authentication,
a safer launcher, and one bounded outbound-call workflow. It does not certify
the platform's other channels, generated gap routes, or external integrations.

## Configuration and sessions

- `JWT_SECRET` has no fallback. It must be a non-placeholder value of at least
  32 characters; `openssl rand -base64 48` is an appropriate generator. Tokens
  are restricted to HS256 plus the expected issuer and audience.
- Dashboard rendering verifies the session, and middleware verifies signed
  cookies before internal API access. Authentication is not authorization:
  each resource query must still enforce organization membership.
- `.env`, `.env.local`, private keys, and local audit data are ignored. CI checks
  that secret-bearing filename patterns are not tracked. `.env.example` contains
  names and empty placeholders only.
- The local `.env` and `telyn.key` found during this pass were not present in
  reachable Git object names and were restricted to mode `0600`. Their values
  were not printed. Operators must identify their provenance and rotate them if
  they were ever copied, logged, backed up insecurely, or readable by others.
- The current local `JWT_SECRET` fails the new strength check and must be replaced
  before `start.sh` will run. Existing cookies will be invalidated, as intended.

## Launch blockers

- Telephony provider callbacks are intentionally exempt from browser-cookie
  middleware, but Twilio, Vapi, and Bland signature/credential validation is not
  implemented consistently. Keep callbacks private or disabled until each route
  verifies the provider's signed request and rejects replays.
- Many legacy CRUD routes predate strict tenancy. Some still query without an
  `orgId`, or treat a missing tenant as an unrestricted query. The outbound-call
  initiation route and standalone lead workflow are tenant-scoped, but the
  remainder require a route-by-route authorization migration and negative tests.
- Login has no distributed rate limit, account lockout policy, MFA, password
  reset, or security-event stream.
- Active calls, audio, transfer state, and timers are held in process memory.
  Restarts and multi-instance deployments lose or split that state. Durable job
  storage, idempotent webhook processing, retries, and operator cancellation are
  required.
- Provider webhooks can currently write transcripts and call records without a
  durable replay key. Recording/transcription consent, retention, deletion,
  suppression lists, and jurisdiction-specific calling rules are not complete.
- Integration configuration can contain provider credentials in database JSON.
  Encryption at rest, scoped access, rotation metadata, and redacted logging are
  not demonstrated.
- The repository has no reviewed Prisma migration history. Production changes
  must not use `prisma db push`; create and review migrations in a disposable
  environment, back up data, and use a controlled deployment process.
- Generic AI and generated gap endpoints do not validate every model response
  against schemas or ground recommendations in authoritative business data.
  Treat output as untrusted and require domain-specific evaluation before use.

## Bounded outbound-call controls

The standalone Vapi sequence is offline by default. Live execution requires
`--execute`, `--confirm-live-calls`, and a consent-basis label; validates E.164
numbers; deduplicates and caps targets; uses request and polling timeouts; stops
on uncertain provider or persistence state; and writes a private operational
JSONL trail. Tenant-scoped lead updates preserve existing customer status and
carry a provider-call idempotency marker.

These controls do not prove that a call is lawful or that consent is valid. The
local JSONL file is not immutable and contains personal data. Enforce policy in
an independently controlled consent/suppression system and durable audit sink.

Do not report a suspected credential or personal-data exposure in a public
issue. This repository does not identify a private security contact, which must
be established before launch.
