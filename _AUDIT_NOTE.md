# Audit Note - luranAi

Source: `_AUDIT/reports/batch_10.md` (lines 771-803).

## Original Audit Recommendations

### What's Missing
- Live agent handoff from AI.
- Conversation coaching for human agents.
- Multi-language support with auto-translation.
- Customer sentiment tracking across channels.
- ROI attribution (campaign → conversion).
- Competitor call recording analysis.

### Custom Feature Suggestions
1. Omnichannel handoff agent.
2. Sales coaching AI.
3. Predictive customer service.
4. Conversation intelligence + coaching.
5. Revenue attribution.
6. Voice + vision combo.

## Implementations Applied

Added 2 helper functions in `src/lib/openrouter.ts` and 2 Next.js API routes following the existing `route.ts` pattern (`NextRequest`/`NextResponse.json`):
- `POST /api/ai/handoff-summary` — concise handoff for human agent takeover.
- `POST /api/ai/agent-coaching` — post-call coaching analysis.

Code style matches existing repo conventions (no semicolons, NextResponse.json with status codes, OpenRouter via `callOpenRouter`). No new dependencies.

## Backlog (Prioritized)

### High
- Multi-language support / auto-translation (per-call language detection + LLM routing).
- Cross-channel sentiment tracking dashboard (Contact-level rollup).
- ROI attribution model (campaign → conversion link).

### Medium
- Predictive proactive outreach for at-risk customers.
- Voice + vision (video-call) support.

### Low / Product Decisions
- Competitor call analysis.
- Real-time live coaching during calls (streaming inference).

## Apply pass 3 (frontend)

LEFT-AS-IS. FE already complete: `src/app/(dashboard)/handoff-summary/page.tsx` and `src/app/(dashboard)/agent-coaching/page.tsx` are full Next.js client pages that POST to `/api/ai/handoff-summary` and `/api/ai/agent-coaching` respectively. As same-origin Next.js App Router routes, no JWT Bearer is needed (rest of app's `/api/ai/*` follows the same in-domain pattern; auth is via Next.js cookie session). Pages auto-registered via App Router file convention. No changes needed (idempotence rule).

## Apply pass 4 (mechanical backlog)

Mechanical items only — skipped TOO-RISKY (live coaching streaming inference, voice+vision video) and NEEDS-PRODUCT-DECISION (competitor call analysis, ROI attribution model schema).

BE additions in `src/lib/openrouter.ts` (new helper `isOpenRouterConfigured()` for 503 detection, plus three new exported call functions matching the existing `callOpenRouter` pattern, no semicolons, claude-haiku-4.5 default):
- `translateMessage(text, targetLanguage, sourceLanguage?, channel?)`
- `sentimentRollup(perChannelSentiments[], contactLabel?)`
- `predictiveProactiveOutreach(contactProfile, recentInteractions, business_goal?)`

New API routes (Next.js App Router, `NextRequest`/`NextResponse.json`, 503 when key missing):
- `POST /api/ai/translate-message` — multi-language translation that preserves tone, IDs, channel norms.
- `POST /api/ai/sentiment-rollup` — cross-channel sentiment aggregation; trend direction, divergence flags, escalation risk.
- `POST /api/ai/proactive-outreach` — predictive customer service: at-risk/opportunity detection, channel choice, draft message.

New dashboard pages (App Router auto-registration, primary-color Tailwind palette, `AIResponseDisplay` component, in-domain fetch — no JWT Bearer needed since Luran uses same-origin cookie session):
- `src/app/(dashboard)/translate-message/page.tsx`
- `src/app/(dashboard)/sentiment-rollup/page.tsx`
- `src/app/(dashboard)/proactive-outreach/page.tsx`

All three pages handle the 503 path explicitly with a friendly "AI service unavailable" message.

Total: 3 mechanical features. `npx tsc --noEmit` clean.

Backlog still mechanical-but-out-of-scope-for-this-pass: applying `isOpenRouterConfigured()` retroactively to the older `/api/ai/*` routes that don't yet 503 explicitly.
