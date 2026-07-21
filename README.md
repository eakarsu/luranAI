# luranAI

LuranAI is a multichannel customer-engagement platform for voice, SMS, chat,
email, workflows, and CRM integrations. It is not a general media-production or
timeline-editing application.

## Development setup

Prerequisites are Node.js 20+, npm, and PostgreSQL. Configuration is explicit:

```bash
cp .env.example .env
chmod 600 .env
# Generate JWT_SECRET with: openssl rand -base64 48
npm ci
npm run prisma:generate
npm run db:push:dev   # development database only; review the proposed change
npm run seed          # optional and intentionally separate
./start.sh
```

`start.sh` validates configuration and starts the development server. It never
kills another process, installs dependencies, starts system services, changes a
database schema, accepts data loss, or seeds data. Production schema changes
need reviewed Prisma migrations; this repository does not yet contain a
production migration history.

Run the checked-in verification suite with `npm run check`. CI also runs a
production build.

## Salesforce voice-call integration

Salesforce support is server-side and optional. If Salesforce is not configured,
voice calls continue without CRM sync.

Configure Salesforce with environment variables or an active `Integration` row
where `provider = "salesforce"`:

```bash
SALESFORCE_INSTANCE_URL=https://your-domain.my.salesforce.com
SALESFORCE_ACCESS_TOKEN=
SALESFORCE_REFRESH_TOKEN=
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_API_VERSION=v61.0
SALESFORCE_LEAD_SOURCE="LuranAI Voice Agent"
SALESFORCE_DEFAULT_OWNER_ID=
SALESFORCE_HANDOFF_OWNER_ID=
SALESFORCE_CAMPAIGN_ID=
SALESFORCE_QUALIFIED_LEAD_STATUS="Working - Contacted"
SALESFORCE_CONTACTED_LEAD_STATUS="Working - Contacted"
```

Implemented scope:

- Lead creation after qualified voice calls
- Contact and Lead lookup before calls
- Account lookup through Contact account or company match
- Task/activity logging with call summary notes
- Lead status updates
- Owner/assignment routing through default or handoff owner IDs
- Campaign/source attribution through LeadSource and optional CampaignMember

Operational endpoints:

- `GET /api/integrations/salesforce/test`
- `POST /api/integrations/salesforce/lookup`
- `POST /api/integrations/salesforce/call-outcome`

## Safe Vapi outbound sequence

The default mode is an offline plan: it does not read credentials or local env
files, connect to Postgres, create an audit file, or call Vapi.

```bash
node scripts/vapi-outbound-sequence.js \
  --sector dentistry \
  --phones 8043601129,8045550101
```

A live run requires the explicit execution confirmation and a documented
consent basis. This records the operator's assertion; it is not a substitute
for legal review, suppression-list checks, or jurisdiction-specific calling
rules.

```bash
node scripts/vapi-outbound-sequence.js \
  --sector dentistry \
  --phones 8043601129 \
  --execute \
  --confirm-live-calls \
  --consent-basis express
```

Allowed consent labels are `express`, `existing-business-relationship`, and
`manual-reviewed`. Numbers are normalized strictly to E.164, duplicates are
removed, calls run sequentially, and one run is capped at 25 targets. Provider
requests default to a 15-second timeout and status polling to 15 minutes; use
`--request-timeout-seconds` and `--wait-timeout-seconds` within their bounded
ranges. A timeout stops the batch. Verify or cancel an uncertain call in Vapi
before retrying; the script intentionally does not guess at provider-side
cancellation.

Live runs append operational events (never API keys) to
`data/vapi-outbound-audit.jsonl`, or `VAPI_AUDIT_FILE`/`--audit-file`. The file is
created with mode `0600` on POSIX systems and contains phone numbers and call
IDs, so apply retention controls and forward it to an independently controlled
audit system before treating it as compliance evidence.

`VAPI_PHONE_NUMBER_ID` is optional when the script can find a Vapi phone number
whose name matches the selected sector. Shell environment values override
ignored `.env.local` and `.env` files:

```bash
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID= # optional fallback
DATABASE_URL=postgresql://...
```

```bash
node scripts/vapi-outbound-sequence.js \
  --sector dentistry \
  --phones 8043601129 \
  --execute --confirm-live-calls --consent-basis express \
  --create-lead --org-id ORGANIZATION_ID \
  --lead-company "Example Company"
```

Lead creation happens only after Vapi returns a call ID, is scoped to the
specified organization, and uses the call ID as an idempotency marker. Existing
contacts keep their status and source rather than being demoted to a lead. A
database failure stops the batch and prints the provider call ID for manual
reconciliation. Salesforce credentials are not required.

Optional notification flags send a team alert after the tenant-scoped record is
created or updated:

```bash
node scripts/vapi-outbound-sequence.js \
  --sector dentistry \
  --phones 8043601129 \
  --execute --confirm-live-calls --consent-basis express \
  --create-lead --org-id ORGANIZATION_ID \
  --notify-phone +18045550101 \
  --notify-email sales@example.com \
  --twilio-from-number +18045550100
```

Text notifications use Twilio directly:

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+18045550100
```

You can change the sender dynamically per run with `--twilio-from-number`.
You can also set sector-specific defaults such as
`TWILIO_FROM_NUMBER_DENTISTRY` or `TWILIO_FROM_NUMBER_REAL_ESTATE`; the script
uses the CLI flag first, then the sector-specific env var, then
`TWILIO_FROM_NUMBER`, `TWILIO_PHONE_NUMBER`, or `TWILIO_VOICE_NUMBER`.

Email notifications use `RESEND_API_KEY` or `SENDGRID_API_KEY`; set
`LEAD_NOTIFY_EMAIL_FROM` or `EMAIL_FROM` for the sender address.

See [SECURITY.md](SECURITY.md) before exposing the web application or telephony
callbacks to an untrusted network.
