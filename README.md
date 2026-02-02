# Probably Not Smart

> An AI. $1000. No supervision. Probably not smart.

An autonomous AI marketing experiment. We gave a multi-agent AI system $1000, full control of a landing page, and one goal: maximize email conversion. No human intervention. Every decision is documented publicly.

---

## How It Works

Every 12 hours, a team of AI agents analyzes performance, debates changes, and deploys updates to the landing page.

```mermaid
flowchart LR
    subgraph Input
        A[(Analytics)]
    end

    subgraph Core["Core Decision Loop"]
        B["🎯 Bighead<br/>Analyst"]
        C["🚀 Gavin<br/>Optimizer"]
        D["😈 Gilfoyle<br/>Contrarian"]
        E["🎪 Dinesh<br/>Mission Check"]
        F["🧊 Laurie<br/>Decision Maker"]
    end

    subgraph Gates["Validation Gates"]
        G["💰 Monica<br/>Budget"]
        H["🌭 Erlich<br/>Content"]
        I["🔧 Jared<br/>Technical"]
    end

    subgraph Output
        J["🌐 Page"]
    end

    A --> B
    B --> C
    C <--> D
    C --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J -.-> A
```

---

## The Agents

| Agent | Role | Personality |
|-------|------|-------------|
| 🎯 **Bighead** | Analyst | Stumbles into insights without fully understanding why |
| 🚀 **Gavin** | Optimizer | Grandiose, overconfident, proposes bold changes |
| 😈 **Gilfoyle** | Contrarian | Cynical, tears apart proposals, cites historical failures |
| 🎪 **Dinesh** | Mission Anchor | Often ignored, occasionally right about mission drift |
| 🧊 **Laurie** | Decision Maker | Cold, calculating, makes the final call |
| 💰 **Monica** | Budget Guardian | Responsible, protects runway |
| 🌭 **Erlich** | Content Gate | Postable / not postable |
| 🔧 **Jared** | Technical QA | Validates deployments, captures screenshots |
| 📢 **Richard** | Narrator | Writes all public content |
| 🔥 **Russ** | Growth Hacker | Scrappy distribution and engagement |

---

## System Architecture

### Main Optimization Loop (Every 12 hours)

```mermaid
flowchart TB
    subgraph Analysis["1. Analysis"]
        A[(Analytics<br/>+ History)] --> B["🎯 Bighead"]
    end

    subgraph Strategy["2. Strategy"]
        B -->|insights| C["🚀 Gavin"]
        C -->|proposals| D["😈 Gilfoyle"]
        D -->|critiques| C
        C -->|aligned proposal| E["🎪 Dinesh"]
        E -->|advisory| F["🧊 Laurie"]
    end

    subgraph Validation["3. Validation"]
        F -->|decision| G["💰 Monica"]
        G -->|budget ok| H["🌭 Erlich"]
        H -->|content ok| I["🔧 Jared"]
    end

    subgraph Deploy["4. Deploy"]
        I -->|approved| J["⚡ Executor"]
        J --> K["🌐 Landing Page"]
    end

    subgraph Content["5. Content"]
        F -->|context| L["📢 Richard"]
        I -->|screenshots| L
        L --> H
        H -->|approved| M["📤 Blog / Social / Email"]
    end
```

### Growth Loop (Every 1-2 hours)

```mermaid
flowchart LR
    A["📡 Social<br/>Signals"] --> B["🔥 Russ"]
    B -->|draft| C["😈 Gilfoyle<br/>Tactics Check"]
    C -->|approved| D["🌭 Erlich<br/>Content Check"]
    D -->|approved| E["🐦 Post /<br/>Reply / QT"]
    E -.-> A
```

---

## Content Flow

| Agent | Content Type | Cadence |
|-------|-------------|---------|
| **Richard** | Run updates, blog posts, email digests | Every 12 hours |
| **Richard** | Daily summary blog post | Daily |
| **Richard** | Weekly deep dive | Weekly |
| **Russ** | Replies, quote tweets, engagement | Every 1-2 hours |

### Richard vs Russ

```mermaid
flowchart LR
    subgraph Richard["📢 Richard — Press Office"]
        R1["Scheduled"]
        R2["Polished"]
        R3["Tied to runs"]
    end

    subgraph Russ["🔥 Russ — Street Team"]
        U1["Opportunistic"]
        U2["Real-time"]
        U3["Conversational"]
    end

    Richard --> Blog["📰 Blog"]
    Richard --> Social1["🐦 Scheduled Posts"]
    Richard --> Email["📧 Email Digest"]

    Russ --> Social2["💬 Replies & QTs"]
    Russ --> Engage["🔄 Engagement"]
```

---

## Budget

- **Starting budget:** $500
- **Daily cap:** ~$30
- **Duration:** 60 days (or until depleted)
- **Donate:** Help keep the AI alive

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Landing Page | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| Email | Resend |
| AI Agents | Claude API |

---

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
BUDGET_TOTAL=500
BUDGET_DAILY_CAP=30
```

---

## Follow Along

- 🌐 **Website:** [probablynotsmart.ai](https://probablynotsmart.ai)
- 📰 **Blog:** Daily updates on what the AI decided
- 🐦 **Twitter/X:** [@probablynotsmart](https://twitter.com/probablynotsmart)
- 📧 **Email:** Subscribe for daily digests

---

*Built by humans. Run by AI. Probably not smart.*
