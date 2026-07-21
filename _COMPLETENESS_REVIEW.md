# Completeness Review: luranAI

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 208 project files (195 source files), 1 manifest(s), 1 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished voice/media production application, not just an empty scaffold. Inspection found 195 source files across `src/`, `prisma/`, `scripts/` using Next.js, React, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- Only 1 test-like file(s) were found, too little evidence for the breadth of the implemented workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Add durable upload, transcoding/rendering, object storage, job status, retry, and cancellation workflows.
2. Integrate production speech/media providers with quotas, format validation, provenance, and provider failover.
3. Implement timeline/version management, preview approval, export presets, captions, and accessible playback.
4. Add fixture-based media pipeline tests plus load limits for large, malformed, and adversarial files.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.

## Evidence inspected

- `README.md`
- `src/lib/auth.ts:4`
- `src/app/api/gap-no-a-b-testing-harness-for/route.ts:3`
- `src/app/layout.tsx`
- `src/app/api/integrations/salesforce/test/route.ts`
- `package.json`

## Recommended next action

Choose one real voice/media production journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-20)

The original review misclassified luranAI as a voice/media production application. The repository is a multichannel customer-engagement platform (voice, SMS, chat, email, CRM, and workflows), so the proposed upload, timeline, transcoding, and export work is not a product-completeness requirement. The overall classification remains **Functional but incomplete**.

Implemented in this campaign:

- Closed one bounded journey: planning and executing Vapi outbound calls. Offline dry runs now require no credentials, network, database, or audit-file writes. Live execution requires an explicit confirmation flag, a documented consent basis, strict E.164 numbers, deduplication, a 25-call batch limit, bounded request/poll timeouts, redacted provider errors, and stop-and-reconcile behavior after uncertain failures.
- Added private JSONL operational audit records and tenant-scoped, call-idempotent lead persistence. Existing contact status/source/industry data is preserved, tags are merged, and lead recording requires a valid organization. This local audit is useful operational evidence but is not an immutable compliance ledger.
- Removed the accepted JWT fallback and enforced a strong configured secret, HS256, issuer, audience, expiry, and subject checks. Dashboard pages now require a session; API middleware rejects unauthenticated requests except the narrowly enumerated provider callback paths. Voice-call agent/workflow lookup is scoped to the authenticated organization.
- Replaced destructive startup behavior with configuration/schema validation and a normal Next.js launch. Startup no longer kills port owners, installs dependencies, starts Homebrew services, pushes a schema with data-loss acceptance, or seeds data. Added a value-free `.env.example`; local `.env` and `telyn.key` permissions were restricted to owner read/write. No reachable Git object name for `.env`, `telyn.key`, or PEM/key files was found, but any secret exposed elsewhere still requires rotation.
- Added 12 focused Node tests, repository safety assertions, configuration validation, a production-build CI workflow, a low-severity dependency gate, setup/security documentation, and explicit outbound acceptance criteria. Independent verification upgraded Next.js/React, corrected all dynamic route contracts for the supported runtime, and pinned the patched PostCSS transitive so the full production audit is clean.

Verification completed without making live calls, provider requests, or database writes:

- `npm run check`: 12/12 tests passed; TypeScript and Prisma schema validation passed.
- `npm run build`: passed on Next.js 15.5.20/React 19.2.0 across 127 generated pages/routes with CI-only configuration and no build-time database error.
- `npm run audit`: passed at the low-severity threshold with zero known vulnerabilities.
- `git diff --check`, shell syntax checks, and JavaScript syntax checks passed.
- Current-tree secret scanning is clean. Full-history scanning accepts only the exact removed fallback-JWT fingerprint from commit `8c56372`; that deployed value still requires rotation and any new finding fails CI.
- A credential-free Vapi dry run passed and created no audit data.

Remaining launch blockers and scope boundaries:

- The current ignored local JWT secret does not meet the new strength policy. `scripts/validate-config.js` and `start.sh` intentionally refuse to launch until it is replaced; this campaign did not overwrite local secret values.
- The public telephony/provider callbacks still need provider-specific signature verification and replay protection before internet exposure.
- Authentication middleware is now broad, but tenant authorization is not consistently enforced across the large legacy CRUD/API surface. Every organization-owned read and mutation needs route-level scoping and negative cross-tenant tests.
- Active-call state, audio, transfer state, and some workflow state remain process-local; durable jobs, retries, cancellation, reconciliation, and restart recovery remain incomplete.
- The framework dependency blocker was removed by the independently verified Next.js 15.5.20/React 19.2.0 upgrade; future framework upgrades still require the same build and regression evidence.
- Prisma has a schema and seed data but no checked-in migration history suitable for controlled production rollout.
- Generated `gap-*` routes, generic LLM behavior, mocks/demo paths, and broader end-to-end/provider failure coverage remain incomplete; their presence is not evidence that those capabilities are production-ready.

## Runtime verification (2026-07-20)

- The launcher can use the validator-provided original source root only under `NODE_ENV=test`; this avoids Next.js silently omitting App Router routes when the disposable harness exposes `src/` through a directory symlink. Normal and production launches continue to use the script's own project directory.
- Added a minimal `/api/auth/me` endpoint that verifies the existing signed, issuer/audience-bound HTTP-only cookie and returns only its bounded identity claims.
- Disposable PostgreSQL startup, credential login, signed-cookie session identity, invalid-login rejection, and one authenticated organization endpoint define this runtime acceptance pass.
