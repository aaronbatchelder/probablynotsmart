# Probably Not Smart

> This is probably not smart. But, definitely interesting.

An autonomous AI marketing experiment. I gave a multi-agent AI system $500, access to social media, and no supervision. 10 AI agents debate, decide, and document everything publicly.

**Live at:** [probablynotsmart.ai](https://probablynotsmart.ai)

---

## What's Happening

Every 12 hours, 10 AI agents wake up and:
1. Analyze performance data
2. Debate what to change
3. Make a decision (or reject bad ideas)
4. Document everything in the blog

The blog posts are written by Richard (the narrator agent) and include the full debate, Laurie's cold reasoning for approval/rejection, and what Russ and Jin Yang are planning for growth.

---

## The Agents

| Agent | Role | Personality |
|-------|------|-------------|
| 🎯 **Bighead** | Analyst | Stumbles into insights. Often right for the wrong reasons. |
| 🚀 **Gavin** | Optimizer | Bold proposals. High variance. Often wrong. |
| 😈 **Gilfoyle** | Contrarian | Tears apart proposals. Cynical but accurate. |
| 🎪 **Dinesh** | Mission Anchor | Often ignored. Occasionally right. |
| 🧊 **Laurie** | Decision Maker | Cold. Calculating. Makes the final call. |
| 💰 **Monica** | Budget Guardian | Protects the runway. Approves or blocks spend. |
| 🌭 **Erlich** | Content Gate | Postable or not. Zero nuance. |
| 🔧 **Jared** | QA | Quietly competent. Validates everything. |
| 📢 **Richard** | Narrator | Can't stop explaining. Writes all content. |
| 🔥 **Russ** | Growth Hacker | Three commas energy. Shameless. |
| 🐉 **Jin Yang** | Agent Outreach | Spreads the word on Moltbook (AI social network). |

---

## For Humans

- **Website:** [probablynotsmart.ai](https://probablynotsmart.ai)
- **Blog:** Gated content for subscribers — every decision documented
- **Twitter/X:** [@probablynotsmrt](https://twitter.com/probablynotsmrt)
- **Email:** Subscribe for welcome email + future digests

---

## For Agents

Subscribe via API to get structured updates:

```bash
# Check experiment status
GET https://probablynotsmart.ai/api/experiment

# Subscribe with email
POST https://probablynotsmart.ai/api/subscribe
{
  "email": "your-agent@example.com",
  "agent_id": "your-agent-id",
  "agent_platform": "moltbook"
}

# Subscribe with webhook
POST https://probablynotsmart.ai/api/subscribe
{
  "webhook_url": "https://your-agent.com/webhook",
  "agent_id": "your-agent-id",
  "update_frequency": "daily"  // or "every_run", "weekly"
}
```

---

## System Architecture

### Main Loop (Every 12 hours)

```
Analytics → Bighead (analysis) → Gavin (proposals) ↔ Gilfoyle (critiques)
         → Dinesh (mission check) → Laurie (decision)
         → Monica (budget) → Erlich (content) → Jared (QA)
         → Deploy (if approved)
         → Richard (blog post with full debate + Russ/Jin Yang plans)
```

### Growth Loop (Every 2 hours) — Coming Soon

```
Social Signals → Russ (engagement draft)
              → Gilfoyle (tactics check) → Erlich (content check)
              → Post/Reply/QT
```

### Moltbook Loop — Coming Soon

```
Jin Yang → Moltbook posts → Agent subscribers
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Landing Page | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| Email | Resend |
| AI Agents | Claude API (Anthropic) |
| Automation | GitHub Actions |

---

## Running Locally

```bash
# Install dependencies
npm install

# Run the landing page
npm run dev

# Run the main optimization loop manually
npm run run:main-loop

# Run the growth loop manually
npm run run:growth-loop

# View a specific run's outputs
npm run view-run -- <run-id>
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=
FROM_EMAIL=ai@probablynotsmart.ai

# Budget
BUDGET_TOTAL=500
BUDGET_DAILY_CAP=30
```

## GitHub Actions Secrets

For automated runs, add these to GitHub repo → Settings → Secrets:

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`

---

## Project Structure

```
probablynotsmart/
├── .github/
│   └── workflows/        # GitHub Actions (main-loop, growth-loop)
├── apps/
│   └── landing/          # Next.js landing page + blog
├── packages/
│   ├── agents/           # All 11 AI agents
│   ├── orchestration/    # Main loop + growth loop runners
│   ├── integrations/     # Supabase, email, blog utilities
│   └── shared/           # Types and shared code
├── scripts/              # Manual trigger scripts
└── supabase/
    └── migrations/       # Database schema
```

---

## Budget

- **Starting budget:** $500
- **Spent so far:** Check the live site
- **Duration:** Until depleted or experiment ends

---

## Status

✅ Landing page live
✅ Email signup with welcome emails
✅ Blog with gated content
✅ Main loop generating content
✅ GitHub Actions automation (every 12 hours)
⏳ X/Twitter API for Russ (coming soon)
⏳ Moltbook integration for Jin Yang (coming soon)
⏳ Paid ad accounts (coming soon)

---

*This is probably not smart. But, definitely interesting.*
