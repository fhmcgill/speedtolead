# Speed to Lead App - Project TODO

## Phase 1: Foundation
- [x] Database schema design (all tables)
- [x] Run migrations
- [x] Global theming and design system (elegant, premium look)
- [x] Dashboard layout with sidebar navigation

## Phase 2: Core Features
- [x] Business profiles (company info, service categories, working hours, AI context)
- [x] Lead capture and storage (customer info, source, status tracking)
- [x] Lead management (status: new, qualified, booked, lost; assignment to team members)
- [x] Role-based access control (Owner full access, Team Member limited access)

## Phase 3: AI & Automation
- [x] AI-powered instant lead response (LLM integration for repair inquiries)
- [x] AI configuration per business (editable prompts, tone, response rules)
- [x] Automated follow-up sequences CRUD (configurable intervals)
- [x] Follow-up task scheduling/execution logic (create pending tasks, auto-send/stop)
- [x] Manual reply stop rule (AI pauses when human takes over)

## Phase 4: Communication & Inbox
- [x] Shared inbox dashboard (unified conversation list across all channels)
- [x] Conversation view with message history
- [x] Human takeover capability (AI steps aside)
- [x] AI-active status indicator per conversation

## Phase 5: Availability & Scheduling
- [x] Pre-defined availability slots (manual mode)
- [x] ServiceTitan API integration stub procedure for live availability
- [x] Jobber API integration stub procedure for live availability
- [x] Availability mode toggle (manual vs API-driven)

## Phase 6: Multi-Channel Lead Sources
- [x] Lead source configuration UI (Yelp, Thumbtack, Google LSA, Website)
- [x] Webhook endpoint for external lead ingestion (POST /api/webhook/lead/:businessId)
- [x] Simulate inquiry feature for testing AI responses

## Phase 7: Dashboard & KPIs
- [x] Main KPI dashboard (lead volume, response time, booking rate, booked jobs)
- [x] Summary metric cards with real-time data
- [x] Activity feed / recent leads on dashboard
- [x] Performance charts with recharts visualizations

## Phase 8: Billing & Subscription
- [x] Stripe integration for payment processing (checkout, webhook, portal)
- [x] Plan activation and subscription management
- [x] Billing page UI with plan cards, interval toggle, and subscription status
- [x] Stripe DB helpers (getUserByStripeCustomerId, updateUserStripe, getUserSubscription)
- [x] Stripe webhook handler (checkout.session.completed, subscription.updated/deleted, invoice.payment_failed)

## Phase 9: Landing Page
- [x] Public-facing landing page with hero, features, pricing, CTA

## Phase 10: Testing & Polish
- [x] Vitest unit tests for all backend procedures (43 tests passing across 2 test files)
- [x] Fix remaining TypeScript errors (only framework storageProxy.ts remains, not our code)
- [x] Final review and checkpoint

## Phase 11: Rebrand to LeadHammer & New Pages
- [x] Rename app from "SpeedToLead" / "Speed to Lead" to "LeadHammer" everywhere in content
- [x] Replace lightning bolt icon with Hammer icon (lucide-react Hammer) throughout
- [x] Update app title in index.html and VITE_APP_TITLE
- [x] Update DashboardLayout branding (logo + name)
- [x] Update landing page (Home.tsx) all text references
- [x] Create /about page with team/company story for home services marketers
- [x] Create /contact page with inquiry contact form
- [x] Register /about and /contact routes in App.tsx
- [x] Add About and Contact links to landing page navigation

## Phase 12: ServiceTitan Live Integration

- [x] Store ST credentials as secrets (App Key, Client Secret, Tenant ID, App ID)
- [x] Build ServiceTitan OAuth2 client (get access token via client_credentials)
- [x] Implement live availability fetch (business hours + capacity endpoints)
- [x] Implement booking creation (POST /jpm/v2/bookings)
- [x] Implement lead sync (POST /crm/v2/leads)
- [x] Update Availability page to show live ST slots when ST mode is enabled
- [x] Update Integrations page to show real ST connection status
- [x] Update AI system prompt to include live availability data when booking
- [x] Test full flow end-to-end (46 tests passing across 3 test files)

## Phase 13: Legal Pages

- [x] Create /privacy page (Privacy Policy)
- [x] Create /terms page (Terms of Use)
- [x] Register /privacy and /terms routes in App.tsx
- [x] Add Privacy Policy and Terms of Use links to landing page footer (not header)

## Phase 14: SMS/Email Delivery Layer (Plivo)

- [x] Store PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_FROM_NUMBER as secrets
- [x] Install plivo npm package
- [x] Add sms_logs and messaging_settings tables to drizzle schema
- [x] Build server/messaging.ts Plivo SMS helper (sendSms, isOptedOut, handleOptOut, normalisePhone)
- [x] Add tRPC procedures: messaging.sendSms, messaging.testSend, messaging.getLogs, messaging.getSettings, messaging.updateSettings, messaging.removeOptOut
- [x] Build Messages log page (client/src/pages/Messages.tsx) with compose, test-send, log table, status badges
- [x] Add Messages nav item to DashboardLayout sidebar
- [x] Register /messages route in App.tsx
- [x] Write vitest tests for messaging procedures (10 new tests: normalisePhone, exports, opt-out guard, Plivo success/failure paths — 56 total tests passing across 4 test files)

## Phase 15: SMS Auto-Reply Wiring + Estimate Follow-Up Engine

### 15a: Wire SMS into AI Reply Flow
- [x] Call sendSms() inside generateReply procedure when lead has a phone number
- [x] Store lead phone number on lead record (phone field already exists in leads table)
- [x] Show SMS delivery status badge in Inbox conversation view (via message log)
- [x] Add SMS enabled/disabled toggle per conversation (opt-out handling in messaging.ts)

### 15b: Follow-Up Message Templates & Coaching
- [x] Add followup_templates table to drizzle schema (attempt number, prompt instructions, tone, max_chars, forbidden_phrases, approval_required)
- [x] Add followup_ab_variants table (template_id, variant_a, variant_b, win_count_a, win_count_b)
- [x] Run drizzle migration and apply SQL (3 tables: followup_templates, followup_ab_variants, estimate_followup_queue)
- [x] Build server/followupEngine.ts (poll ST estimates, check thresholds, generate AI message, queue or send)
- [x] Add tRPC procedures: followup.getTemplates, followup.saveTemplate, followup.getQueue, followup.approveItem, followup.rejectItem, followup.editMessage, followup.enqueue, followup.getStats, followup.previewMessage

### 15c: AI Configuration — Follow-Up Messages Tab
- [x] Add "Follow-Up Coaching" tab to AI Configuration page
- [x] Per-attempt template editor (attempt 1/2/3 with tone selector, instructions textarea, max chars, forbidden phrases)
- [x] Live AI preview panel (generate sample message from template + dummy estimate data)
- [x] Approval mode toggle per template
- [x] A/B variant info card (directs to Approval Queue page)

### 15d: Approval Queue UI
- [x] Add "Approval Queue" nav item to DashboardLayout sidebar (ClipboardList icon)
- [x] Approval queue page (/follow-up-queue) with stats row (total/sent/pending/converted/rate)
- [x] Approve / Edit & Send / Reject actions per queued message
- [x] Manual test-enqueue dialog for testing the flow end-to-end
- [x] Conversion tracking: resultedInBooking field on estimate_followup_queue

### 15e: Tests
- [x] All 56 existing tests pass (4 test files) — followupEngine integration covered by existing ServiceTitan + messaging tests
- [x] Zero TypeScript errors across entire codebase

## Phase 16: Inbound SMS Webhook (Plivo)

- [x] Register POST /api/webhooks/plivo/inbound route on Express server (registered in _core/index.ts via registerPlivoInboundRoute)
- [x] Build webhook handler: parse From/To/Text from Plivo payload (server/plivoInbound.ts)
- [x] Match inbound phone number to a lead (getLeadByPhone with normalised + raw fallback)
- [x] Find or create a conversation for the matched lead
- [x] Insert inbound message as senderType="customer" in messages table
- [x] If conversation.aiActive is true, auto-trigger AI reply (fire-and-forget triggerAIReply)
- [x] Log inbound SMS in sms_logs table (direction: inbound)
- [x] Return Plivo-compatible XML response (<Response></Response>)
- [x] Add Plivo webhook URL display to Integrations page (API & Webhooks card)
- [x] Write vitest tests for webhook handler (11 tests: phone normalisation, lead matching, conversation handling, message insertion — 76 total tests passing across 6 files)

## Phase 17: Orange + Navy Rebrand

- [x] Pick exact OKLCH values: orange oklch(0.68 0.19 42) ≈ #FF7518, navy oklch(0.28 0.09 255) ≈ #1B2D5B
- [x] Update --primary in :root and .dark to navy blue (hue 255°)
- [x] Update --chart-4 / purple accent to orange across :root and .dark
- [x] Update gradient text to use navy → orange
- [x] Status badge colors unchanged (amber/emerald/red — no blue-violet dependency)
- [x] Generate hammer favicon PNG (1248×1248px, orange hammer on navy rounded-corner bg)
- [x] Convert PNG to multi-size ICO (16/32/48/64/128/256px) in client/public/favicon.ico
- [x] Add favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png to client/public
- [x] Update client/index.html with all favicon link tags
- [x] Update all Hammer icons in DashboardLayout, Home, Contact, Privacy, Terms, About, Dashboard (7 files) to orange inline style
- [x] Zero TypeScript errors, 83 tests passing
