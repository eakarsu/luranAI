# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server with Turbo (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run Next.js linter
npx tsc --noEmit     # Type check without emitting
npm run seed         # Seed database with sample data
```

### Database

```bash
npx prisma migrate dev       # Create and apply migrations
npx prisma db push           # Push schema changes (no migration file)
npx prisma generate          # Regenerate Prisma client
npx prisma studio            # Open database GUI
```

### Full Setup & Start

```bash
chmod +x start.sh && ./start.sh
```

This script: kills processes on ports 3000/3001/5432, installs deps, generates Prisma client, starts PostgreSQL if needed, pushes DB schema, seeds data, and starts the dev server with hot reloading (Turbopack). Code changes auto-reload.

## Architecture

**Luran AI** is an AI-powered multi-channel communication platform (voice, SMS, chat, email) built for industry-specific use cases.

### Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript strict mode
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: Tailwind CSS v4 with custom primary color palette
- **State**: React Query (60s stale time, no refetch on focus)
- **Auth**: JWT tokens with bcrypt password hashing

### Voice Call Architecture (critical path)

Three voice providers are selectable in the UI via a dropdown:

1. **Twilio** (default) — Webhook-driven STT→LLM→TTS loop. Our code controls the full conversation flow via `/api/voice/call/webhook/answer` and `/api/voice/call/webhook/gather`. Uses OpenAI Whisper for STT and TTS.
2. **Vapi.ai** — All-in-one provider. Single API call creates the call; Vapi handles STT+LLM+TTS+telephony. Webhooks arrive at `/api/voice/call/vapi-webhook`.
3. **Bland.ai** — All-in-one provider. Similar to Vapi. Status and transcript are polled from Bland's API in the status endpoint since webhooks are unreliable. Bland does NOT provide live transcripts during calls — transcript appears after hangup.

**In-memory call state** (`src/lib/call-state.ts`): All three providers share the same `ActiveCall` store keyed by call ID. The UI polls `/api/voice/call/status/[callSid]` every 2 seconds for status and transcript updates.

### Industry Configuration System

`src/lib/industry-config.ts` defines per-industry configs (dentistry, restaurants, health clinics, real estate, etc.) with:
- System prompts, greetings, conversation goals
- Escalation triggers, compliance notes
- Used by voice agents, chat agents, and email agents

### LLM Integration

`src/lib/openrouter.ts` routes all LLM calls through OpenRouter (default model: claude-haiku). Used for voice responses, chat, email drafts, sentiment analysis, and summarization.

## Project Structure

- `src/app/(dashboard)/` — 17+ dashboard pages (voice-agents, chat-agents, contacts, etc.)
- `src/app/(auth)/` — Login page
- `src/app/api/` — 20+ API route groups
- `src/lib/` — Service clients: `twilio.ts`, `vapi.ts`, `bland.ts`, `openrouter.ts`, `whisper.ts`, `call-state.ts`, `industry-config.ts`, `auth.ts`, `prisma.ts`
- `src/components/` — Organized by feature domain + shared `ui/` and `layout/` components
- `prisma/schema.prisma` — 13 models: User, VoiceAgent, ChatAgent, EmailAgent, Contact, Conversation, CallLog, SmsCampaign, Campaign, Integration, KnowledgeBase, Appointment, Template

## Data & Seeding Rules

- Database seed files must include at least 15 items per model to provide realistic test data.

## Code Style

- No semicolons in TypeScript files
- 2-space indentation
- Path alias: `@/*` maps to `src/*`
- Tailwind classes for all styling (no CSS modules or styled-components)
- `'use client'` directive only on pages/components that need browser APIs
- API routes return `NextResponse.json()` with appropriate status codes

## Environment Variables

Required in `.env` (never commit this file):
- `DATABASE_URL` — PostgreSQL connection string
- `OPENROUTER_API_KEY` — LLM via OpenRouter
- `JWT_SECRET` — Auth token signing
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_VOICE_NUMBER` — Twilio
- `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID` — Vapi.ai
- `BLAND_API_KEY` — Bland.ai
- `OPENAI_API_KEY` — Whisper STT/TTS
- `PUBLIC_WEBHOOK_URL` — ngrok URL for voice call webhooks in dev
