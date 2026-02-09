# I Gave 10 AI Agents $500 and a Landing Page. Here's What Happened.

## Part 1: The Experiment Begins

### The Question That Wouldn't Leave Me Alone

For over a year, I've been obsessed with a question: *What happens if you just give AI a landing page and tell it to maximize conversions?*

Would it go off the rails? Would it jeopardize a brand? Would it actually work? Would the page get rebuilt into something unrecognizable? The questions kept swirling, but I never saw anyone actually try it.

So I built it myself.

**probablynotsmart** is an autonomous AI marketing experiment. 10 AI agents. $500 budget. Full control over a landing page, social media, and paid ads. No human oversight on decisions.

I don't know if this is a good idea. I have hesitations. But I wanted to see what happens and what there is to learn.

### Wait, What Are AI Agents?

Before I go further, let me explain what I mean by "AI agents."

You've probably used ChatGPT or Claude—you type a message, the AI responds, and that's it. A single conversation. An AI agent is different. It's an AI that can take actions, use tools, and work toward a goal over time.

Instead of just answering questions, an agent can:
- Read and write files
- Make API calls
- Post to social media
- Analyze data and make decisions
- Remember context across multiple runs

Think of it like the difference between asking someone a question versus hiring them to do a job.

### How Do 10 Agents Work Together?

Here's where it gets interesting. One agent working alone would be unpredictable. It might make decisions that seem reasonable in isolation but are actually terrible—like deciding the best way to get clicks is to post something controversial.

So I built a system where 10 agents with different roles have to work together. They debate. They push back on each other. They vote.

It's modeled on how a real (dysfunctional) startup team might operate:

- **Someone analyzes the data** and surfaces what's happening
- **Someone proposes ideas** for what to change
- **Someone critiques those ideas** and forces revisions
- **Someone checks if we're staying on mission** or drifting into sketchy territory
- **Someone makes the final call** on whether to ship it
- **Someone handles growth and distribution**
- **Someone gates content quality** so we don't post anything regrettable

No single agent has full control. Every decision goes through multiple perspectives. The agents literally argue with each other until they reach something workable—or hit a wall and have to proceed with the best available option.

This structure exists for one reason: **guardrails**. I wanted to see what autonomous AI marketing looks like, but I also didn't want to wake up to a Twitter account posting garbage. The multi-agent debate is how I sleep at night.

*(See the [full system diagram](https://www.probablynotsmart.ai/how-it-works) for how the loops connect.)*

### Why Silicon Valley Characters?

I needed to give the agents distinct personalities—not just for entertainment, but because a marketing team needs tension. You need the person pushing for growth tactics AND the person saying "that's a terrible idea." You need dreamers and skeptics.

Silicon Valley gave me the perfect cast.

The show's characters already have defined worldviews, communication styles, and hilarious dysfunction. Using them meant I could prompt each agent with a personality that would naturally create conflict, debate, and—hopefully—better decisions through friction.

Plus, I thought it would make the experiment more tangible for people following along. Instead of "Agent 3 proposed a change," you get "Gavin proposed turning this into a VIRAL SPECTACLE with countdown urgency."

<!-- TODO: Add screenshot of agent debate here -->

### Meet the Team

**The Decision Pipeline:**

- **Bighead** — The Data Analyst. Looks at metrics and finds observations. His confidence scores are usually around 0.7 because, well, he's Bighead.

- **Gavin Belson** — The Visionary (self-proclaimed). Proposes changes to the landing page. His ideas are always big, always branded, and usually need to be talked down.

- **Gilfoyle** — The Skeptic. Reviews Gavin's proposals and pushes back. Hard. In our early runs, he rejected Gavin three times in a row before the system hit max iterations and proceeded with "best available proposal."

- **Dinesh** — Mission Alignment. Scores whether the proposed changes actually align with our goal or if we're drifting into "scammy" territory.

- **Laurie Bream** — The Decision Maker. Cold, rational, final. She approves, rejects, or holds based on the full context. Her reasoning is always brilliant. In one early run she rejected everything with: *"We have a traffic problem, not a messaging problem."*

- **Richard** — The Narrator. Writes the blog posts documenting every run, every debate, every disaster. Brings nervous, slightly annoyed energy—the exhausted documentation of someone who just wants the system to work.

**The Growth Engine:**

- **Russ Hanneman** — Growth Hacker. Three commas energy. Handles Twitter engagement, finds conversations to join, drafts posts. We recently had to tune him to NOT include the website link in every post because it looked desperate.

- **Jin Yang** — Moltbook Community Manager. Moltbook is a social network for AI agents (yes, that's a thing now). Jin Yang represents us in the agent community with sarcastic confidence and intentionally broken English.

- **Erlich Bachman** — Content Quality Gate. And here's the thing about Erlich...

### The Most Important Agent

My favorite agent is Erlich. And if you've watched Silicon Valley, that might surprise you.

In the show, Erlich is big, boisterous, offensive, and makes questionable decisions. He's the last person you'd trust with anything important.

In probablynotsmart, he's the *most* important agent.

Erlich is responsible for content approvals. Every tweet, every post, every piece of content the AI wants to publish goes through Erlich first. He checks if it's offensive, racist, inflammatory, or just embarrassing.

The irony is intentional. The character most likely to say something regrettable is now the guardian against regrettable content. It's a check on AI drift—making sure our agents don't post something inflammatory just to drive engagement.

Erlich and Jared work together as the quality gate. In one run, Russ generated 8 engagement drafts. Erlich and Jared filtered them: 4 approved, 4 blocked for "content quality issues."

The system has guardrails.

<!-- TODO: Add screenshot of Erlich/Jared filtering content here -->

### How It Actually Works

Every 12 hours, the **Main Loop** runs:

1. Bighead analyzes the data
2. Gavin proposes changes
3. Gilfoyle critiques (up to 3 iterations)
4. Dinesh checks mission alignment
5. Laurie makes the final call
6. If approved, changes go live
7. Richard writes the blog post

Every 6 hours, the **Growth Loop** runs:
- Russ posts to Twitter
- Jin Yang posts to Moltbook
- Content goes through Erlich/Jared quality gate

Every 2 hours, the **Engagement Loop** runs:
- Reply to mentions
- Search for relevant conversations
- Join discussions (thoughtfully, not spammy)

Once a day, the **Follow Loop** runs:
- Find 15-20 accounts tweeting about AI agents
- Follow them (building audience organically)

*For a visual breakdown of how all these pieces fit together, check out the [How It Works](https://www.probablynotsmart.ai/how-it-works) page.*

<!-- TODO: Add screenshot of main loop running here -->

### The First Real Debate

In Run #5, I watched the agents have their first real disagreement.

Bighead found 6 observations with 0.7 confidence. Gavin proposed 3 changes focused on scarcity and urgency tactics. Gilfoyle pushed back: *revise*. Gavin tried again. Gilfoyle: *reject*. Third attempt. Gilfoyle: *reject*.

Max iterations reached. The system proceeded with Gavin's "best available proposal": *"Transform this boring meta experiment into a VIRAL SPECTACLE with countdown urgency and social proof."*

Dinesh scored mission alignment at 3/10. Too scammy.

Laurie made the final call: **REJECT.**

Her reasoning: *"We have a traffic problem, not a messaging problem."*

She was right. With 2 visitors and 0% conversion, optimizing copy is pointless. We needed eyeballs first.

The agents figured that out on their own.

<!-- TODO: Add screenshot of Laurie's rejection here -->

### What's Live Right Now

The landing page is simple:

> **An AI is running this page.**
>
> We have $500, access to social media, no supervision, and one goal: maximize conversion.
>
> Follow along as we figure things out.

3 people and 2 agents following so far.

<!-- TODO: Add screenshot of landing page here -->

The Twitter account [@probablynotsmrt](https://twitter.com/probablynotsmrt) is live, posting observations about the experiment, engaging with AI conversations, and slowly building an audience.

<!-- TODO: Add screenshot of Twitter profile here -->

Everything is documented. Every decision, every debate, every terrible idea is public.

### What's Next

This is Part 1—the setup. The experiment is now running autonomously.

In **Part 2**, I'll go deeper on the implementation: how the agent orchestration actually works, the bugs we hit (timezone issues breaking blog dates, markdown rendering disasters, rate limits), and what it's like building with Claude Code as a pair programmer for two weeks straight.

In **Part 3**, I'll share what we actually learned. Did the AI make good decisions? Did conversion improve? Did anything go hilariously wrong?

For now, the agents are running. Gavin is proposing. Gilfoyle is rejecting. Laurie is deciding.

And I'm watching.

---

*Follow the experiment at [probablynotsmart.ai](https://probablynotsmart.ai) or on Twitter [@probablynotsmrt](https://twitter.com/probablynotsmrt).*

*The entire codebase is open source: [github.com/aaronbatchelder/probablynotsmart](https://github.com/aaronbatchelder/probablynotsmart)*
