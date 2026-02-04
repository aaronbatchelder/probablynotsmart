# probablynotsmart Build Memory

> Last updated: 2026-02-04
> Current phase: Pre-Launch
> Target launch: February 9, 2026

## Project Overview

**probablynotsmart** is an autonomous AI marketing experiment. A multi-agent AI system with $1000, full control of a landing page, paid ad spend, social media access, and one goal: maximize email conversion. No human intervention. Every decision documented publicly.

**Tagline:** An AI. $1000. No supervision. Probably not smart.

**Live at:** [probablynotsmart.ai](https://probablynotsmart.ai)

---

## Launch Checklist (Feb 9)

### ✅ Completed
- [x] Domain configured (probablynotsmart.ai)
- [x] Vercel deployment working
- [x] README updated for humans + agents
- [x] Buy Me a Coffee button added
- [x] Unsubscribe page created
- [x] Agent subscription API (`/api/subscribe`)
- [x] Experiment status API (`/api/experiment`)
- [x] Moltbook integration for Russ
- [x] Site audit completed
- [x] Launch blog post outlined

### 🚧 Pending
- [ ] Create @probablynotsmart Twitter account
- [ ] Create Buy Me a Coffee account
- [ ] Update NEXT_PUBLIC_SITE_URL to .ai in Vercel
- [ ] Connect paid ad accounts (Meta, X Ads)
- [ ] Richard test blog post + email
- [ ] 48h cron job test
- [ ] Test blog gating flow

---

## Project Status

### ✅ Completed Phases

**Phase 1: Foundation** (Jan 21)
- Monorepo structure (apps/, packages/, scripts/, supabase/)
- npm workspaces configuration
- Supabase migration (001_initial_schema.sql)
- TypeScript configs
- Shared types package
- Initial landing page components
- API routes for signup and analytics
- Tailwind CSS with design tokens

**Phase 2: Core Infrastructure** (Jan 21)
- Supabase client integration
- Data fetching functions
- Analytics tracking
- All components connected to live data
- AnalyticsTracker component

**Phase 3: Agents** (Jan 21)
- Claude API wrapper
- Base agent utilities with memory injection
- All 10 agents with unique personalities:
  - 🎯 Bighead (Analyst) - stumbles into insights
  - 🚀 Gavin (Optimizer) - UNHINGED mode, no constraints
  - 😈 Gilfoyle (Contrarian) - tears things apart
  - 🎪 Dinesh (Mission Anchor) - keeps things on track
  - 🧊 Laurie (Decision Maker) - cold, final calls
  - 💰 Monica (Budget Guardian) - protects runway
  - 🌭 Erlich (Content Gate) - postable/not postable
  - 🔧 Jared (Technical QA) - quietly competent
  - 📢 Richard (Narrator) - writes all content
  - 🔥 Russ (Growth Hacker) - Moltbook + human platforms

**Phase 4: Orchestration** (Jan 21)
- Main loop runner (every 12 hours)
- Growth loop runner (every 1-2 hours)
- Cron API endpoints (placeholders for Vercel)
- Manual trigger scripts (`npm run run:main-loop`)
- **TESTED**: Full agent pipeline working

**Phase 5a: Design System** (Jan 21)
- Freeform page changes (no token constraints)
- Gavin can propose ANYTHING
- Visual changelog tracking
- Multi-breakpoint screenshots (Jared)

**Phase 5b: Blog & Email** (Jan 22)
- Gated /blog route (subscribers only)
- Cookie-based auth (30 days)
- Welcome email via Resend
- Blog post publishing for Richard
- Unsubscribe flow

**Phase 5c: Agent Traffic** (Feb 3)
- `/api/subscribe` - email + webhook subscriptions
- `/api/experiment` - agent-readable status
- Moltbook integration for Russ
- StatsBar shows humans vs agents
- Agent-readable JSON-LD metadata

**Phase 6: Deployment** (Feb 3-4)
- GitHub repo: github.com/aaronbatchelder/probablynotsmart
- Vercel deployment
- Domain: probablynotsmart.ai
- Environment variables configured

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Landing Page | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| AI Agents | Claude API (claude-sonnet-4-20250514) |
| Email | Resend |
| Donations | Buy Me a Coffee |
| Styling | Tailwind CSS |

---

## Database Schema

### Tables
- `runs` - Each optimization cycle
- `analytics_events` - Event tracking
- `signups` - Email captures (with subscriber_type: human/agent)
- `agent_subscriptions` - Webhook subscriptions for agents
- `screenshots` - Before/after captures
- `social_posts` - Published content
- `blog_posts` - Richard's content
- `growth_actions` - Russ's engagement log
- `donations` - Keep the AI alive
- `config` - Runtime configuration
- `page_state` - Current landing page state
- `agent_memory` - Personal agent decisions
- `collective_log` - Group decisions

### Views
- `daily_metrics` - Aggregated daily stats
- `budget_status` - Budget overview
- `current_metrics` - Real-time metrics
- `published_posts` - Blog posts for display
- `subscriber_stats` - Human vs agent breakdown

---

## Agent Memory System

Each agent has persistent memory across runs:

**Personal Memory**
- Past 10 decisions with outcomes
- Track record (accuracy stats)
- Self-reflection after results

**Collective Memory**
- Group decisions
- What worked and what didn't
- Shared learnings

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase | Free tier, good API, Postgres |
| Hosting | Vercel | Free tier, easy deploys, cron |
| AI Model | Claude Sonnet | Best reasoning for agents |
| Email | Resend | Simple API, good deliverability |
| Blog | Next.js (not Ghost) | Save money, simpler |
| Gavin Constraints | NONE | Agents are the guardrails |
| Agent Traffic | Yes | Agents can subscribe too |

---

## Environment Setup

| Service | Status |
|---------|--------|
| Supabase | ✅ Connected |
| Vercel | ✅ Deployed |
| GitHub | ✅ github.com/aaronbatchelder/probablynotsmart |
| Anthropic API | ✅ Configured |
| Resend | ✅ Configured |
| Domain | ✅ probablynotsmart.ai |
| X/Twitter | ⏳ Need account |
| Buy Me a Coffee | ⏳ Need account |
| Meta Ads | ⏳ Not started |
| X Ads | ⏳ Not started |

---

## File Structure

```
probablynotsmart/
├── apps/
│   └── landing/              # Next.js landing page + blog
│       └── src/
│           ├── app/          # Pages + API routes
│           ├── components/   # UI components
│           └── lib/          # Supabase, data, analytics
├── packages/
│   ├── agents/               # All 10 AI agents
│   ├── orchestration/        # Main loop + growth loop
│   ├── integrations/         # Supabase, email, Moltbook, social
│   └── shared/               # Types and shared code
├── scripts/                  # Manual trigger scripts
├── supabase/
│   └── migrations/           # Database schema (001-005)
├── docs/
│   ├── SITE_AUDIT_REPORT.md
│   └── LAUNCH_BLOG_POST_OUTLINE.md
├── MEMORY.md                 # This file
└── README.md                 # Public documentation
```

---

## Session History

### Session 1 (Jan 21, 2026)
- Completed Phases 1-4
- All 10 agents built and tested
- Main loop and growth loop working
- Gavin proposed "SCARCITY REVOLUTION", Laurie rejected it

### Session 2 (Jan 22, 2026)
- Completed Phase 5a (freeform design system)
- Completed Phase 5b (blog & email)
- Agent memory system implemented

### Session 3 (Feb 3, 2026)
- Completed Phase 5c (Moltbook, agent subscriptions)
- GitHub repo created and pushed
- Vercel deployment
- Domain configuration started

### Session 4 (Feb 4, 2026)
- Domain SSL resolved (probablynotsmart.ai live)
- README updated for humans + agents
- Buy Me a Coffee button added
- Unsubscribe page created
- Site audit completed
- Launch blog post outlined

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/signup` | POST | Human email signup |
| `/api/subscribe` | POST/GET | Agent subscriptions |
| `/api/experiment` | GET | Experiment status for agents |
| `/api/analytics` | POST | Event tracking |
| `/api/auth/access` | POST | Blog gate check |
| `/api/unsubscribe` | POST | Email unsubscribe |
| `/api/config` | GET | Dynamic page config |
| `/api/experiments` | GET | Visual changelog |

---

## For Agents

```bash
# Check experiment status
GET https://probablynotsmart.ai/api/experiment

# Subscribe for updates
POST https://probablynotsmart.ai/api/subscribe
{
  "webhook_url": "https://your-agent.com/webhook",
  "agent_id": "your-agent-id",
  "update_frequency": "daily"
}
```

---

*probablynotsmart: An AI. $1000. No supervision. Probably not smart.*
