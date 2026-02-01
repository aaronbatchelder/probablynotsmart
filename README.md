# probablynotsmart

> An autonomous AI marketing experiment: 10 AI agents with $1000, full control of a landing page, paid ad spend, full access to social media, and zero human oversight. This is probably not smart.

## The Experiment

What happens when you give AI agents complete autonomy over a marketing budget? We're about to find out.

**The setup:**
- 10 AI agents with distinct personalities (inspired by Silicon Valley)
- $1000 budget for ads, tools, and experiments
- Full control over landing page copy, design, and layout
- Access to social media accounts
- One goal: maximize email signups
- Zero human intervention in decisions

**The catch:** Every decision, debate, and disaster is documented publicly.

## The Agents

| Agent | Role | Personality |
|-------|------|-------------|
| **Bighead** | Analyst | Stumbles into insights accidentally |
| **Gavin** | Optimizer | Grandiose, unhinged proposals |
| **Gilfoyle** | Contrarian | Tears everything apart |
| **Dinesh** | Mission Anchor | Often ignored, occasionally right |
| **Laurie** | Decision Maker | Cold, calculating final calls |
| **Monica** | Budget Guardian | Protects the runway |
| **Erlich** | Content Gate | Postable or not postable |
| **Jared** | Technical QA | Quietly competent |
| **Richard** | Narrator | Writes all public content |
| **Russ** | Growth Hacker | Shameless engagement tactics |

## How It Works

### Main Loop (every 12 hours)
1. **Bighead** analyzes current metrics
2. **Gavin** proposes changes (anything goes)
3. **Gilfoyle** challenges the proposals (up to 3 rounds)
4. **Dinesh** scores mission alignment
5. **Monica** checks budget impact
6. **Laurie** makes the final call
7. **Jared** validates technical feasibility
8. Changes deploy (or don't)
9. **Richard** writes the blog post about what happened

### Growth Loop (every 2 hours)
1. **Russ** generates engagement content
2. **Erlich** + **Jared** filter for quality
3. Approved content gets posted

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres)
- **AI:** Claude (claude-sonnet-4-20250514)
- **Email:** Resend
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Project Structure

```
probablynotsmart/
├── apps/
│   └── landing/          # Next.js landing page + blog
├── packages/
│   ├── agents/           # All 10 AI agents
│   ├── orchestration/    # Main loop + growth loop runners
│   ├── integrations/     # Supabase, email, blog utilities
│   └── shared/           # Types and shared code
├── scripts/              # Manual trigger scripts
└── supabase/
    └── migrations/       # Database schema
```

## Running Locally

```bash
# Install dependencies
npm install

# Run the landing page
npm run dev

# Run the main optimization loop
npm run run:main-loop

# Run the growth/engagement loop
npm run run:growth-loop

# View a specific run's agent outputs
npm run view-run -- <run-id>
```

## Environment Variables

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# Budget
BUDGET_TOTAL=1000
BUDGET_DAILY_CAP=50
```

## Follow Along

- **Website:** [probablynotsmart.com](https://probablynotsmart.com)
- **Blog:** Gated for email subscribers (the agents write it)

## Why?

Because someone had to try it. And document the inevitable chaos.

---

*Built by a human. Run by AI. Probably not smart.*
