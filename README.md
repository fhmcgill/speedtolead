# LeadHammer (formerly Speed to Lead)

LeadHammer is a full-stack web application that helps home service companies (HVAC, plumbing, electrical, etc.) respond to leads instantly using AI. It captures leads from multiple channels, engages them in seconds via SMS, and automates follow-up sequences from a unified dashboard.

> **Migration status:** This app was originally built on the Manus platform. It is being migrated to run independently, with the Manus-proprietary auth and LLM layers replaced. See "Migration Notes" below.

## Features

- **AI-Powered Instant SMS Response** — Intelligent replies customizable per business (tone, context, rules), delivered via Plivo
- **Unified Inbox** — All conversations in one place with AI takeover toggle (AI pauses when a human replies)
- **Lead Management** — Track, assign, and update lead status through a pipeline
- **Smart Scheduling** — Manual time slots or live ServiceTitan availability/booking sync
- **Automated Follow-Ups** — AI-generated follow-up sequences with A/B template variants and an approval queue
- **Inbound SMS Webhook** — Plivo inbound messages auto-match to leads and trigger AI replies
- **KPI Dashboard & Analytics** — Lead volume, response times, booking rates, recharts visualizations
- **Team Management** — Owner and Team Member roles with lead assignment
- **Multi-Channel Capture** — Yelp, Thumbtack, Google LSA, website webhooks
- **Billing & Subscriptions** — Stripe-powered checkout, webhooks, and customer portal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI, shadcn/ui components |
| State | TanStack React Query |
| API | tRPC (type-safe RPC) |
| Backend | Express.js, Node.js |
| Database | MySQL via Drizzle ORM |
| SMS | Plivo |
| Payments | Stripe |
| Field Service | ServiceTitan API |
| Package Manager | pnpm |
| Tests | Vitest (83 passing) |

## Migration Notes

This codebase was built on Manus and has two dependencies on Manus-proprietary infrastructure that do not work outside that platform:

1. **Auth** (`server/_core/oauth.ts`, `server/_core/sdk.ts`) — calls Manus's `WebDevAuthPublicService` OAuth server. Being replaced with an independent auth provider.
2. **LLM layer** (`server/_core/llm.ts`) — calls Manus's "Forge" API. Being replaced with the Anthropic Claude API.

Target deployment: Railway, with a MySQL service.

## Project Structure

```
client/       React frontend (pages, components, UI library)
server/       Express + tRPC backend, integrations (Plivo, Stripe, ServiceTitan)
drizzle/      Database schema, migrations
shared/       Code shared between client and server
```

## Development

```bash
pnpm install
pnpm dev      # start dev server
pnpm test     # run vitest suite
pnpm check    # TypeScript check
pnpm build    # production build
```
