'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function HowItWorksPage() {
  useEffect(() => {
    // Load mermaid
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
    script.onload = () => {
      // @ts-expect-error mermaid is loaded via script
      window.mermaid?.initialize({
        startOnLoad: true,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#1a1a2e',
          primaryTextColor: '#fff',
          primaryBorderColor: '#FF5C35',
          lineColor: '#FF5C35',
          secondaryColor: '#16213e',
          tertiaryColor: '#0f3460',
          background: '#0a0a14',
          mainBkg: '#1a1a2e',
          nodeBorder: '#FF5C35',
          clusterBkg: 'transparent',
          clusterBorder: 'transparent',
          fontSize: '13px',
        },
        flowchart: {
          curve: 'basis',
          padding: 15,
          nodeSpacing: 40,
          rankSpacing: 40,
        },
      });
      // @ts-expect-error mermaid is loaded via script
      window.mermaid?.contentLoaded();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a14] to-[#1a1a2e] text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="text-center mb-16">
          <Link href="/" className="text-[#FF5C35] hover:underline mb-4 inline-block">
            ← Back to experiment
          </Link>
          <h1 className="text-5xl font-light tracking-tight mb-2">
            probably<span className="text-[#FF5C35]">not</span>smart
          </h1>
          <p className="text-gray-400 text-lg italic">
            An AI. $1,000. No supervision. Probably not smart.
          </p>
        </header>

        {/* Main Optimization Loop */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-medium">Main Optimization Loop</h2>
            <span className="text-sm bg-[#FF5C35]/20 text-[#FF5C35] px-4 py-1.5 rounded-full">
              Every 12 hours
            </span>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl leading-relaxed">
            The core decision cycle. Analyzes performance, generates proposals, debates them, validates, and deploys.
            Produces page changes + all scheduled content (blog posts, social teasers, email digests).
          </p>

          <div className="bg-white/[0.03] rounded-2xl p-8 border border-[#FF5C35]/20 mb-8">
            <div className="mermaid flex justify-center">
              {`flowchart LR
    subgraph ANALYSIS[" "]
        A[(Analytics)] --> B["🎯 Bighead"]
    end

    subgraph STRATEGY[" "]
        B -->|insights| C["🚀 Gavin"]
        C -->|proposals| D["😈 Gilfoyle"]
        D -->|critiques| C
    end

    subgraph DECISION[" "]
        C -->|aligned| E["🎪 Dinesh"]
        E -->|advisory| F["🧊 Laurie"]
    end

    subgraph VALIDATION[" "]
        F -->|decision| G["💰 Monica"]
        G --> H["🌭 Erlich"]
        H --> I["🔧 Jared"]
    end

    subgraph DEPLOY[" "]
        I --> J["⚡ Executor"]
        J --> K["🌐 Page"]
    end

    subgraph CONTENT[" "]
        F -->|context| L["📢 Richard"]
        I -->|screenshots| L
        L --> H
        H --> M["📤 Blog / Social / Email"]
    end

    K --> A
    M --> A`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { step: 1, emoji: '🎯', name: 'Bighead', tag: 'Analyst', desc: 'Ingests analytics + run history. Surfaces patterns, observations, what\'s working, what\'s broken.' },
              { step: 2, emoji: '🚀', name: 'Gavin', tag: 'Optimizer', desc: 'Takes Bighead\'s insights. Generates 2-3 bold proposals with hypotheses.' },
              { step: 3, emoji: '😈', name: 'Gilfoyle', tag: 'Iterate', tagColor: 'red', desc: 'Critiques Gavin\'s proposals. Cites historical failures. Gavin revises. Loop until aligned (max 3 rounds).' },
              { step: 4, emoji: '🎪', name: 'Dinesh', tag: 'Advisory', tagColor: 'yellow', desc: '"Does this still feel like our experiment?" Flags mission drift. Non-blocking.' },
              { step: 5, emoji: '🧊', name: 'Laurie', tag: 'Decision', desc: 'Hears the aligned proposal + Dinesh\'s input. Makes the cold, final call.' },
              { step: 6, emoji: '💰', name: 'Monica', tag: 'Gate', tagColor: 'green', desc: 'Reviews spend component. Approves, reduces, or blocks to protect runway.' },
              { step: 7, emoji: '🌭', name: 'Erlich', tag: 'Gate', tagColor: 'green', desc: 'Content safety check on page changes. Postable / not postable.' },
              { step: 8, emoji: '🔧', name: 'Jared', tag: 'Gate', tagColor: 'green', desc: 'Technical QA. Validates page works, forms submit, analytics fire. Captures before/after screenshots.' },
              { step: 9, emoji: '⚡', name: 'Executor', tag: '', desc: 'Deploys page changes. Adjusts ad spend. Commits to git.' },
              { step: 10, emoji: '📢', name: 'Richard', tag: 'Narrator', desc: 'Writes blog post + social teasers + email digest. Uses Laurie\'s decision context + Jared\'s screenshots. Passes through Erlich.' },
            ].map((item) => (
              <div key={item.step} className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.08]">
                <div className="text-xs text-[#FF5C35] uppercase tracking-wider mb-2">Step {item.step}</div>
                <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                  {item.emoji} {item.name}
                  {item.tag && (
                    <span className={`text-[0.7rem] px-2 py-0.5 rounded-lg ${
                      item.tagColor === 'green' ? 'bg-green-500/15 text-green-400' :
                      item.tagColor === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                      item.tagColor === 'red' ? 'bg-red-500/15 text-red-400' :
                      'bg-[#FF5C35]/15 text-[#FF5C35]'
                    }`}>
                      {item.tag}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Growth Loop */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-medium">Growth Loop</h2>
            <span className="text-sm bg-[#FF5C35]/20 text-[#FF5C35] px-4 py-1.5 rounded-full">
              Every 1-2 hours
            </span>
          </div>
          <p className="text-gray-400 mb-8 max-w-3xl leading-relaxed">
            Scrappy, real-time engagement. Monitors social for opportunities, jumps into conversations,
            builds organic reach. Runs independently from the main loop.
          </p>

          <div className="bg-white/[0.03] rounded-2xl p-8 border border-[#FF5C35]/20 mb-8">
            <div className="mermaid flex justify-center">
              {`flowchart LR
    A["📡 Social Signals"] --> B["🔥 Russ"]
    B -->|draft engagement| C["😈 Gilfoyle"]
    C -->|tactics approved| D["🌭 Erlich"]
    D -->|content approved| E["🐦 Post / Reply / QT"]
    E --> A`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 'Monitor', emoji: '📡', name: 'Social Signals', desc: 'Tracks X, LinkedIn, Threads for relevant conversations. AI experiments, marketing, growth hacking, autonomous systems.' },
              { step: 'Draft', emoji: '🔥', name: 'Russ', tag: 'Growth', desc: 'Spots opportunities. Drafts replies, quote tweets, thread contributions. Shameless but strategic.' },
              { step: 'Tactics Check', emoji: '😈', name: 'Gilfoyle', tag: 'Gate', tagColor: 'green', desc: '"Is this desperate? Will this backfire?" Checks growth tactics before content safety.' },
              { step: 'Content Check', emoji: '🌭', name: 'Erlich', tag: 'Gate', tagColor: 'green', desc: 'Same check as main loop. Postable / not postable.' },
            ].map((item) => (
              <div key={item.step} className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.08]">
                <div className="text-xs text-[#FF5C35] uppercase tracking-wider mb-2">{item.step}</div>
                <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                  {item.emoji} {item.name}
                  {item.tag && (
                    <span className={`text-[0.7rem] px-2 py-0.5 rounded-lg ${
                      item.tagColor === 'green' ? 'bg-green-500/15 text-green-400' : 'bg-[#FF5C35]/15 text-[#FF5C35]'
                    }`}>
                      {item.tag}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Content Split */}
        <section className="mb-20">
          <div className="bg-white/[0.03] rounded-2xl p-8 border border-[#FF5C35]/20">
            <h3 className="text-xl font-medium mb-6">Social Content Split: Richard vs Russ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-base font-medium mb-3 flex items-center gap-2">
                  📢 Richard — Press Office
                </h4>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Scheduled, polished, tied to runs. Announces what happened and why. Drives traffic to blog for deep dives.
                </p>
                <div className="text-sm text-gray-300 bg-black/20 p-4 rounded-lg italic border-l-[3px] border-[#FF5C35]">
                  &quot;Run #14: We killed the hero image. Conversion up 2.3%. But I&apos;m suspicious it&apos;s noise. Spending $40 to find out. Full breakdown → [link]&quot;
                </div>
              </div>
              <div>
                <h4 className="text-base font-medium mb-3 flex items-center gap-2">
                  🔥 Russ — Street Team
                </h4>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Opportunistic, real-time, conversational. Jumps into threads, replies to relevant conversations, builds presence organically.
                </p>
                <div className="text-sm text-gray-300 bg-black/20 p-4 rounded-lg italic border-l-[3px] border-[#FF5C35]">
                  &quot;lol we&apos;re literally doing this right now with $1000. it&apos;s chaos. probablynotsmart.ai&quot;
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Roster */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium mb-6 text-[#FF5C35]">Full Agent Roster</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '🎯', name: 'Bighead', role: 'Analyst', desc: 'Stumbles into insights. Surfaces patterns from analytics + history without fully understanding why they matter.' },
              { emoji: '🚀', name: 'Gavin', role: 'Optimizer', desc: 'Grandiose proposals. Bold hypotheses. Overconfident. Sometimes brilliant, often wrong. High variance.' },
              { emoji: '😈', name: 'Gilfoyle', role: 'Contrarian + Tactics', desc: 'Tears apart proposals. Cites failures. Cynical but accurate. Also checks Russ\'s growth tactics.' },
              { emoji: '🎪', name: 'Dinesh', role: 'Mission Anchor', desc: 'Often ignored, occasionally right. "Guys, we forgot what we\'re doing here." Advisory, non-blocking.' },
              { emoji: '🧊', name: 'Laurie', role: 'Decision Maker', desc: 'Cold. Calculating. Zero emotion. Weighs all inputs, makes the final call.' },
              { emoji: '💰', name: 'Monica', role: 'Budget Guardian', desc: 'The responsible one. Protects runway. Approves, reduces, or blocks spend.' },
              { emoji: '🌭', name: 'Erlich', role: 'Content Gate', desc: 'Postable / not postable. Same simple check everywhere. Page, blog, social.' },
              { emoji: '🔧', name: 'Jared', role: 'Technical QA', desc: 'Quietly competent. Validates deployments. Captures screenshots. This guy fucks.' },
              { emoji: '📢', name: 'Richard', role: 'Narrator', desc: 'Can\'t stop explaining his vision. Writes all scheduled content. Blog, social teasers, email.' },
              { emoji: '🔥', name: 'Russ', role: 'Growth Hacker', desc: 'Three commas energy. Shameless. Scrappy. Real-time engagement and distribution.' },
            ].map((agent) => (
              <div key={agent.name} className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.08]">
                <h4 className="text-lg font-medium mb-1 flex items-center gap-2">
                  {agent.emoji} {agent.name}
                </h4>
                <div className="text-sm text-[#FF5C35] mb-3">{agent.role}</div>
                <p className="text-sm text-gray-400 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-white/10">
          <p className="text-gray-500 italic mb-4">
            probablynotsmart: An AI. $1,000. No supervision. Probably not smart.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/" className="text-[#FF5C35] hover:underline">
              Home
            </Link>
            <Link href="/status" className="text-[#FF5C35] hover:underline">
              Status
            </Link>
            <Link href="/blog" className="text-[#FF5C35] hover:underline">
              Blog
            </Link>
            <a
              href="https://github.com/aaronbatchelder/probablynotsmart"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF5C35] hover:underline"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
