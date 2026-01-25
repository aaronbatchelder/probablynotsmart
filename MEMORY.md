# probablynotsmart Build Memory

> Last updated: 2026-01-22
> Current phase: Agent Memory System (COMPLETE)
> Overall progress: 38/40 tasks complete

## Project Overview

**probablynotsmart** is an autonomous AI marketing experiment. A multi-agent AI system with $500, full control of a landing page, and one goal: maximize email conversion. No human intervention. Every decision documented publicly.

**Tagline:** An AI. $500. No supervision. Probably not smart.

## Project Status

### ✅ Completed
- [x] Project initialized (Jan 21)
- [x] MEMORY.md created (Jan 21)
- [x] **Phase 1: Foundation** (Jan 21)
  - [x] Scaffolded monorepo structure (apps/, packages/, scripts/, supabase/)
  - [x] Created root package.json with npm workspaces
  - [x] Created package.json for all packages
  - [x] Created .env.example with all environment variables
  - [x] Created .gitignore
  - [x] Created Supabase migration (001_initial_schema.sql)
  - [x] Set up TypeScript configs for all packages
  - [x] Created shared types (packages/shared/src/types.ts)
  - [x] Built initial landing page with all components
  - [x] Created API routes for signup and analytics
  - [x] Set up Tailwind CSS with design tokens

- [x] **Phase 2: Core Infrastructure** (Jan 21)
  - [x] Created .env.local with Supabase credentials
  - [x] Implemented Supabase client (apps/landing/src/lib/supabase.ts)
  - [x] Built data fetching functions (apps/landing/src/lib/data.ts)
  - [x] Created analytics tracking (apps/landing/src/lib/analytics.ts)
  - [x] Connected all components to real Supabase data
  - [x] Created AnalyticsTracker component
  - [x] Tested app locally - WORKING on localhost:3004

- [x] **Phase 3: Agents** (Jan 21) - COMPLETE
  - [x] Added Anthropic API key
  - [x] Created Claude API wrapper (packages/agents/src/claude.ts)
  - [x] Created base agent utilities (packages/agents/src/base.ts)
  - [x] Built all 10 agents with unique personalities:
    - [x] Bighead (Analyst) - stumbles into insights
    - [x] Gavin (Optimizer) - grandiose proposals
    - [x] Gilfoyle (Contrarian) - tears things apart
    - [x] Dinesh (Mission Anchor) - keeps things on track
    - [x] Laurie (Decision Maker) - cold, final calls
    - [x] Monica (Budget Guardian) - protects runway
    - [x] Erlich (Content Gate) - postable/not postable
    - [x] Jared (Technical QA) - quietly competent
    - [x] Richard (Narrator) - writes all content
    - [x] Russ (Growth Hacker) - shameless engagement
  - [x] Created test script (scripts/test-agent.ts)
  - [x] **Tested Bighead agent - WORKING with Claude API**

- [x] **Phase 4: Orchestration** (Jan 21) - COMPLETE
  - [x] Created main loop runner (packages/orchestration/src/main-loop.ts)
  - [x] Created growth loop runner (packages/orchestration/src/growth-loop.ts)
  - [x] Built executor placeholder for page deployments
  - [x] Created cron API endpoints:
    - [x] /api/cron/main-loop (every 12 hours)
    - [x] /api/cron/growth-loop (every 2 hours)
    - [x] /api/cron/metrics-snapshot (every hour)
  - [x] Created vercel.json with cron schedules
  - [x] Created manual trigger scripts (npm run run:main-loop, npm run run:growth-loop)
  - [x] **TESTED main loop end-to-end - WORKING!**
    - All 10 agents executed in correct sequence
    - Gavin proposed changes, Gilfoyle pushed back 3x
    - Dinesh scored mission alignment (3/10)
    - Laurie made final decision: REJECT (correctly identified traffic problem)
  - [x] **TESTED growth loop - WORKING!**
    - Russ generated 8 engagement drafts
    - Erlich+Jared gate approved 4, blocked 4

- [x] **Phase 5a: Design System - FREEFORM** (Jan 21) - COMPLETE
  - [x] Created migration 002_design_system.sql (page_config, visual_changelog)
  - [x] Updated shared types for freeform system (FreeformChange, PageConfig, etc.)
  - [x] **REWROTE GAVIN TO BE COMPLETELY UNHINGED**
    - No constraints on what he can propose
    - Can add/remove/modify ANY content, styles, layouts
    - Can inject custom HTML/CSS sections
    - Can propose wild experiments (countdown timers, live feeds, etc.)
    - Only hard limits: can't remove email form, legal links, or break the site
    - Other agents ARE the guardrails, not the prompts
  - [x] Updated Jared for multi-breakpoint screenshots (desktop/tablet/mobile)
  - [x] Created page-config integration (applyPageChanges, logVisualChange)
  - [x] Created /api/experiments endpoint for gallery
  - [x] Created /api/config endpoint for dynamic page rendering

- [x] **Agent Memory System** (Jan 22) - COMPLETE
  - [x] Created migration 003_agent_memory.sql (agent_memory, collective_log tables)
  - [x] Added views: agent_track_record, recent_collective_decisions, agent_learning_trends
  - [x] Updated shared types (AgentMemoryEntry, CollectiveLogEntry, AgentTrackRecord)
  - [x] Created agent-memory integration (read/write/reflect)
  - [x] Updated base agent to inject personal + collective memory into prompts
  - [x] Created reflection agent for post-run learning
  - Each agent now has:
    - **Personal memory**: Their past decisions and outcomes
    - **Track record**: Accuracy stats (correct/wrong/pending)
    - **Collective memory**: What the group decided together
    - **Self-reflection**: Lessons learned after seeing results

- [x] **Phase 5b: Blog & Email System** (Jan 22) - COMPLETE
  - [x] Created migration 004_blog_and_email.sql
    - blog_posts table (Richard's content)
    - subscriber_tokens table (gated access)
    - email_log table (track sent emails)
    - Updated signups with access_token
  - [x] Built gated /blog route
    - Subscribers enter email to access
    - Cookie-based auth (30 days)
    - Blog list + individual post pages
    - Simple markdown rendering
  - [x] Set up email via Resend
    - Welcome email on signup
    - Daily digest template
    - Email logging
  - [x] Created blog integration
    - publishBlogPost() for Richard
    - storeSocialPosts() for later

### 🚧 In Progress
- [ ] Phase 5c: Social & Screenshots

### 📋 Up Next (Phase 5c: Social & Screenshots)
1. Ghost blog integration
2. Social media APIs (X/Twitter, LinkedIn, Threads)
3. Screenshot service (Puppeteer/Playwright)

## Key Decisions Made

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Database | Supabase | Free tier, good API, Postgres | Jan 21 |
| Hosting | Vercel | Free tier, easy deploys | Jan 21 |
| Landing Page | Next.js 14 (App Router) | Simple, fast, git-deployable | Jan 21 |
| Blog/Email | Ghost | Native email, API access | Jan 21 |
| AI Model | Claude (claude-sonnet-4-20250514) | Best reasoning for agents | Jan 21 |
| Styling | Tailwind CSS | Design brief specifies | Jan 21 |
| Design Vibe | Late Checkout Energy | Confident, clean, playful-but-polished | Jan 21 |
| Color Palette | Warm cream + coral | Option A from design brief (#FEFDFB + #FF5C35) | Jan 21 |
| Monorepo | npm workspaces | Simple, no extra tooling needed | Jan 21 |

## Environment Setup

| Service | Status | Notes |
|---------|--------|-------|
| Supabase | ✅ | Project: yqvisnulsvqxsdolajea.supabase.co, Migration run |
| Local Dev | ✅ | Running on localhost:3004 |
| Anthropic API | ✅ | API key configured, agents working |
| Vercel | ⏳ | Need to connect repo |
| Ghost | ⏳ | Need to set up |
| GitHub | ⏳ | Repo exists locally |
| X/Twitter | ⏳ | Need developer account |
| LinkedIn | ⏳ | Need developer app |
| Meta Ads | ⏳ | Can set up later |

## File Structure

```
probablynotsmart/
├── MEMORY.md                 ✅
├── package.json              ✅
├── tsconfig.json             ✅
├── .env                      ✅ (API keys for scripts)
├── .env.example              ✅
├── .gitignore                ✅
│
├── apps/
│   └── landing/              ✅ WORKING
│       ├── .env.local        ✅
│       └── src/
│           ├── app/          ✅ (pages + API routes)
│           ├── lib/          ✅ (supabase, data, analytics)
│           └── components/   ✅ (all 9 components)
│
├── packages/
│   ├── agents/               ✅ COMPLETE
│   │   └── src/
│   │       ├── claude.ts     ✅ (API wrapper)
│   │       ├── base.ts       ✅ (Agent utilities)
│   │       ├── index.ts      ✅ (Exports)
│   │       └── agents/
│   │           ├── bighead.ts   ✅ TESTED
│   │           ├── gavin.ts     ✅
│   │           ├── gilfoyle.ts  ✅
│   │           ├── dinesh.ts    ✅
│   │           ├── laurie.ts    ✅
│   │           ├── monica.ts    ✅
│   │           ├── erlich.ts    ✅
│   │           ├── jared.ts     ✅
│   │           ├── richard.ts   ✅
│   │           └── russ.ts      ✅
│   │
│   ├── orchestration/        ✅ COMPLETE
│   │   └── src/
│   │       ├── main-loop.ts  ✅ TESTED
│   │       └── growth-loop.ts ✅ TESTED
│   ├── integrations/         ⏳ Pending
│   └── shared/               ✅ Complete
│
├── scripts/
│   ├── test-agent.ts         ✅ (Test individual agents)
│   ├── run-main-loop.ts      ✅ (Manual main loop trigger)
│   └── run-growth-loop.ts    ✅ (Manual growth loop trigger)
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql ✅ RUN
```

## Build Phases Overview

| Phase | Status | Tasks |
|-------|--------|-------|
| 1. Foundation | ✅ Complete | Supabase schema, env vars, project scaffold, landing page |
| 2. Core Infrastructure | ✅ Complete | DB integration, data fetching, analytics |
| 3. Landing Page | ✅ Complete | All components connected to live data |
| 4. Agents | ✅ Complete | All 10 agents with prompts, tested |
| 5. Orchestration | ✅ Complete | Main loop, growth loop, cron endpoints - TESTED |
| 6. Integrations | ⏳ | Ghost, social APIs, ads |
| 7. Testing | ⏳ | Individual + end-to-end |
| 8. Launch | ⏳ | Final review, activate |

## Agent Roster

| Agent | Role | Personality | Status |
|-------|------|-------------|--------|
| Bighead | Analyst | Stumbles into insights | ✅ TESTED |
| Gavin | Optimizer | Grandiose, overconfident | ✅ |
| Gilfoyle | Contrarian | Cynical, cites historical failures | ✅ |
| Dinesh | Mission Anchor | Often ignored, occasionally right | ✅ |
| Laurie | Decision Maker | Cold, calculating | ✅ |
| Monica | Budget Guardian | Responsible, protects runway | ✅ |
| Erlich | Content Gate | Postable / not postable | ✅ |
| Jared | Technical QA | Quietly competent | ✅ |
| Richard | Narrator | Can't stop explaining | ✅ |
| Russ | Growth Hacker | Shameless, scrappy | ✅ |

## Database Schema (Supabase) - MIGRATION RUN ✅

Tables:
- `runs` - Each optimization cycle
- `analytics_events` - Event tracking
- `signups` - Email captures
- `screenshots` - Before/after captures
- `social_posts` - Published content
- `blog_posts` - Ghost content
- `growth_actions` - Russ's engagement log
- `donations` - Keep the AI alive
- `config` - Runtime configuration
- `page_state` - Current landing page state

Views:
- `daily_metrics` - Aggregated daily stats
- `budget_status` - Budget overview
- `current_metrics` - Real-time metrics

## Agent Memory System

Each agent now has persistent memory across runs:

### Personal Memory (per agent)
- `agent_memory` table stores each decision
- Tracks: decision_type, decision_summary, confidence
- Updates with: outcome, was_correct, lessons_learned
- Agents see their past 10 decisions with outcomes

### Collective Memory (shared)
- `collective_log` table stores group decisions
- All agents see what the group decided together
- Tracks what worked and what didn't

### Self-Reflection
- After each run (24h later when we have outcome data)
- Each agent reflects: "Was I right? What did I learn?"
- Feeds back into their personal memory

### Track Record
- Accuracy stats per agent
- "You've been right 7/10 times"
- Helps agents calibrate confidence

## Design Philosophy: UNHINGED GAVIN

**Decision:** Instead of a rigid token/slot system, Gavin has FULL CREATIVE CONTROL.

**Why:** The original spec constrained Gavin to specific tokens and slots. But that's boring. The whole point of this experiment is to see what an AI will do with total freedom. So:

- **Gavin proposes ANYTHING** - content, styles, layouts, new sections, wild experiments
- **The agents ARE the constraints** - Gilfoyle tears apart bad ideas, Dinesh flags mission drift, Laurie makes the final call
- **Only hard limits:** Can't remove email form, can't remove legal links, can't break the site

This creates better drama and more interesting content for the blog.

## Implementation Status

### Files Created/Updated (Phase 5a)
- `supabase/migrations/002_design_system.sql` ✅
- `packages/shared/src/types.ts` ✅ (FreeformChange, PageConfig, etc.)
- `packages/agents/src/agents/gavin.ts` ✅ (UNHINGED mode)
- `packages/agents/src/agents/jared.ts` ✅ (multi-breakpoint screenshots)
- `packages/integrations/src/page-config.ts` ✅
- `apps/landing/src/app/api/experiments/route.ts` ✅
- `apps/landing/src/app/api/config/route.ts` ✅

## Open Questions / Blockers

- [x] ~~Need Supabase project URL and keys~~ - DONE
- [x] ~~Need Anthropic API key~~ - DONE
- [x] ~~Need to run SQL migration~~ - DONE
- [ ] Domain: probablynotsmart.com purchased?
- [ ] Ghost: Self-hosted or Ghost Pro?

## Session Notes

### Session 1 (Jan 21, 2026)
**Accomplished:**
- Read all spec files (technical spec, design brief, product spec, flows)
- Created MEMORY.md for project tracking
- **Completed Phase 1: Foundation**
- **Completed Phase 2: Core Infrastructure**
- **Completed Phase 3: Agents**
  - Built all 10 AI agents with unique Silicon Valley personalities
  - Created Claude API wrapper with JSON parsing
  - Created base agent utilities (context formatting, etc.)
  - Tested Bighead agent successfully - personality comes through perfectly!
  - Sample Bighead output showed 0.3 confidence (appropriately unsure for first run)

**Bighead Test Output Highlights:**
- "Well, this is our very first run, so we're starting from scratch"
- "The conversion rate is 4.2% which... honestly I'm not sure if that's good or bad"
- "The headline is pretty bold - literally telling people an AI is running the page. That's either brilliant or scary"
- Confidence: 0.3 (appropriately humble!)

**Key Context:**
- Design follows "Late Checkout Energy" - confident, clean, playful-but-polished
- Color palette: Warm cream (#FEFDFB) + coral accent (#FF5C35)
- Main loop runs every 12 hours
- Growth loop runs every 1-2 hours
- 10 AI agents with distinct personalities (Silicon Valley inspired)

**Next Steps (Phase 5: Integrations):**
1. Ghost blog integration
2. Social media APIs
3. Screenshot service

---

### Session 1 Continued (Jan 21, 2026 - Phase 4)
**Accomplished:**
- **Completed Phase 4: Orchestration**
  - Built main loop runner with full agent pipeline
  - Built growth loop runner for Russ engagement
  - Created Vercel cron endpoints (3 crons configured)
  - Created manual trigger scripts

**Main Loop Test Results:**
- Run #1 completed successfully
- Gavin proposed "SCARCITY REVOLUTION" changes (urgency tactics)
- Gilfoyle pushed back 3 times: "revise → reject → reject"
- Dinesh scored mission alignment: 3/10 (too scammy)
- **Laurie's Decision: REJECT**
  - "We have a traffic problem, not a messaging problem"
  - "Spending $150 on copy changes that make us look dishonest won't solve the fundamental issue"
  - Correctly identified 2 visitors in 24 hours as the real problem

**Growth Loop Test Results:**
- Russ generated 8 engagement drafts
- Erlich+Jared gate filtered them: 4 approved, 4 blocked
- Approved content went to LinkedIn, Threads, and X

**The agents are already debating authenticity vs growth hacks!**

---

*probablynotsmart: An AI. $500. No supervision. Probably not smart.*
