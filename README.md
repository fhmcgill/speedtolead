# SpeedLead - AI-Powered Lead Response for Home Services

SpeedLead is a full-stack web application that helps home service companies (HVAC, plumbing, electrical, etc.) respond to leads instantly using AI. It captures leads from multiple channels, engages them in seconds, and automates follow-up sequences from a unified dashboard.

## Features

- **AI-Powered Instant Response** - Intelligent replies customizable per business (tone, context, rules)
- **Unified Inbox** - All conversations from every channel in one place with AI toggle
- **Lead Management** - Track, assign, and update lead status through a pipeline
- **Smart Scheduling** - Manual time slots or real-time sync via ServiceTitan / Jobber
- **Automated Follow-Ups** - Configurable sequences that halt when a customer responds or books
- **KPI Dashboard and Analytics** - Track lead volume, response times, booking rates, and team performance
- **Team Management** - Owner and Team Member roles with lead assignment
- **Multi-Channel Capture** - Yelp, Thumbtack, Google LSA, and website forms
- **Billing and Subscriptions** - Starter ($49/mo), Professional ($99/mo), and Enterprise ($199/mo) plans

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI, shadcn/ui components |
| State | TanStack React Query |
| API | tRPC (type-safe RPC) |
| Backend | Express.js, Node.js |
| Auth | OAuth (Manus Auth) |
| Icons | Lucide React |
| Notifications | Sonner |

## Project Structure

```
speedtolead/
├── client/src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── DashboardLayout.tsx  # Sidebar + main layout
│   ├── contexts/ThemeContext.tsx
│   ├── lib/
│   │   ├── auth.ts              # Auth hooks
│   │   ├── trpc.ts              # tRPC client
│   │   └── utils.ts             # cn() utility
│   ├── pages/
│   │   ├── Home.tsx             # Landing page
│   │   ├── Dashboard.tsx        # KPI overview
│   │   ├── Inbox.tsx            # Unified inbox
│   │   ├── Leads.tsx            # Lead management
│   │   ├── Availability.tsx     # Scheduling
│   │   ├── FollowUps.tsx        # Follow-up sequences
│   │   ├── Analytics.tsx        # Charts and metrics
│   │   ├── AIConfig.tsx         # AI configuration
│   │   ├── Team.tsx             # Team management
│   │   ├── Integrations.tsx     # Lead sources
│   │   ├── Billing.tsx          # Subscription plans
│   │   ├── Settings.tsx         # Business settings
│   │   └── NotFound.tsx         # 404 page
│   ├── App.tsx                  # Router setup
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind + CSS variables
├── server/
│   ├── index.ts                 # Express server
│   └── router.ts                # tRPC router (all API endpoints)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── postcss.config.js
```

## API Endpoints (tRPC)

| Router | Procedures |
|--------|-----------|
| auth | me (query), logout (mutation) |
| business | get, create, update |
| leads | list, create, updateStatus, assign |
| conversations | list, get, sendMessage, toggleAI |
| ai | generateReply, simulateInquiry |
| availability | list, create, update, delete |
| followUps | list, create, update, delete |
| kpi | stats |
| team | list, create, update, delete |
| sources | list, create, update |
| billing | getSubscription, createCheckout, createPortal |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server (frontend)
npm run dev

# Start the backend server (in a separate terminal)
npm run server
```

The frontend runs on http://localhost:5173 and proxies API calls to the backend on http://localhost:3000.

## Routes

| Path | Page |
|------|------|
| / | Landing page |
| /dashboard | Dashboard with KPIs |
| /inbox | Unified inbox |
| /inbox/:id | Specific conversation |
| /leads | Lead management |
| /availability | Scheduling configuration |
| /follow-ups | Follow-up sequences |
| /analytics | Analytics and charts |
| /ai-config | AI configuration |
| /team | Team management |
| /integrations | Lead sources and integrations |
| /billing | Billing and subscription |
| /settings | Business settings |

## Pricing Plans

| Plan | Monthly | Yearly | Leads | Team |
|------|---------|--------|-------|------|
| Starter | $49/mo | $39/mo | 50/mo | 1 |
| Professional | $99/mo | $79/mo | 250/mo | 5 |
| Enterprise | $199/mo | $158/mo | Unlimited | Unlimited |

## License

Private - All rights reserved.
