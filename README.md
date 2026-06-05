# luranAI

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
