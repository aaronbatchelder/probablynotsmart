import Link from 'next/link';

export const metadata = {
  title: 'Status | probably not smart',
  description: 'Live project status and build memory for the probably not smart AI marketing experiment.',
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[#FEFDFB]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-12">
          <Link href="/" className="text-[#FF5C35] hover:underline mb-4 inline-block">
            ← Back to experiment
          </Link>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">
            Build Memory
          </h1>
          <p className="text-[#6B6B6B]">
            Everything the AI (and humans) need to know about this experiment.
          </p>
        </header>

        <article className="prose prose-lg max-w-none">
          {/* Project Overview */}
          <section className="mb-12 p-6 bg-[#F7F5F2] rounded-lg">
            <p className="text-lg text-[#1A1A1A] mb-4">
              <strong>probably not smart</strong> is an autonomous AI marketing experiment. I gave a multi-agent AI system $500, full control of a landing page, paid ad spend, social media access, and one goal: maximize email conversion. No human intervention. Every decision documented publicly.
            </p>
            <p className="text-[#FF5C35] font-medium text-lg">
              Tagline: An AI. $500. No supervision. Probably not smart.
            </p>
          </section>

          {/* Quick Stats */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Current Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🚀</div>
                <div className="text-sm text-[#6B6B6B]">Phase</div>
                <div className="font-bold text-[#1A1A1A]">Pre-Launch</div>
              </div>
              <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-sm text-[#6B6B6B]">Target Launch</div>
                <div className="font-bold text-[#1A1A1A]">Feb 9, 2026</div>
              </div>
              <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-sm text-[#6B6B6B]">AI Agents</div>
                <div className="font-bold text-[#1A1A1A]">10 Active</div>
              </div>
              <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-sm text-[#6B6B6B]">Budget</div>
                <div className="font-bold text-[#1A1A1A]">$500</div>
              </div>
            </div>
          </section>

          {/* The Team */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">The Agent Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { emoji: '🎯', name: 'Bighead', role: 'Analyst', desc: 'Stumbles into insights' },
                { emoji: '🚀', name: 'Gavin', role: 'Optimizer', desc: 'UNHINGED mode, no constraints' },
                { emoji: '😈', name: 'Gilfoyle', role: 'Contrarian', desc: 'Tears things apart' },
                { emoji: '🎪', name: 'Dinesh', role: 'Mission Anchor', desc: 'Keeps things on track' },
                { emoji: '🧊', name: 'Laurie', role: 'Decision Maker', desc: 'Cold, final calls' },
                { emoji: '💰', name: 'Monica', role: 'Budget Guardian', desc: 'Protects runway' },
                { emoji: '🌭', name: 'Erlich', role: 'Content Gate', desc: 'Postable/not postable' },
                { emoji: '🔧', name: 'Jared', role: 'Technical QA', desc: 'Quietly competent' },
                { emoji: '📢', name: 'Richard', role: 'Narrator', desc: 'Writes all content' },
                { emoji: '🔥', name: 'Russ', role: 'Growth Hacker', desc: 'Moltbook + human platforms' },
              ].map((agent) => (
                <div key={agent.name} className="flex items-start gap-3 p-4 bg-white border border-[#E5E5E5] rounded-lg">
                  <span className="text-2xl">{agent.emoji}</span>
                  <div>
                    <div className="font-bold text-[#1A1A1A]">{agent.name}</div>
                    <div className="text-sm text-[#FF5C35]">{agent.role}</div>
                    <div className="text-sm text-[#6B6B6B]">{agent.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Stack */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Tech Stack</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1A1A1A] text-white">
                    <th className="text-left p-3 rounded-tl-lg">Component</th>
                    <th className="text-left p-3 rounded-tr-lg">Technology</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Landing Page', 'Next.js 14 (App Router)'],
                    ['Hosting', 'Vercel'],
                    ['Database', 'Supabase (Postgres)'],
                    ['AI Agents', 'Claude API (claude-sonnet-4)'],
                    ['Email', 'Resend'],
                    ['Donations', 'Buy Me a Coffee'],
                    ['Styling', 'Tailwind CSS'],
                  ].map(([component, tech], i) => (
                    <tr key={component} className={i % 2 === 0 ? 'bg-[#F7F5F2]' : 'bg-white'}>
                      <td className="p-3 border-b border-[#E5E5E5]">{component}</td>
                      <td className="p-3 border-b border-[#E5E5E5]">{tech}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Completed Phases */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Completed Phases</h2>
            <div className="space-y-4">
              {[
                { phase: 'Phase 1: Foundation', date: 'Jan 21', items: ['Monorepo structure', 'Supabase migration', 'TypeScript configs', 'Initial components'] },
                { phase: 'Phase 2: Core Infrastructure', date: 'Jan 21', items: ['Supabase integration', 'Data fetching', 'Analytics tracking'] },
                { phase: 'Phase 3: Agents', date: 'Jan 21', items: ['Claude API wrapper', 'Base agent utilities', 'All 10 agents built'] },
                { phase: 'Phase 4: Orchestration', date: 'Jan 21', items: ['Main loop (12h)', 'Growth loop (1-2h)', 'Manual triggers'] },
                { phase: 'Phase 5a: Design System', date: 'Jan 21', items: ['Freeform page changes', 'Visual changelog', 'Screenshots'] },
                { phase: 'Phase 5b: Blog & Email', date: 'Jan 22', items: ['Gated blog', 'Welcome email', 'Unsubscribe flow'] },
                { phase: 'Phase 5c: Agent Traffic', date: 'Feb 3', items: ['Agent subscriptions', 'Status endpoint', 'Moltbook integration'] },
                { phase: 'Phase 6: Deployment', date: 'Feb 3-4', items: ['GitHub repo', 'Vercel deployment', 'Domain: probablynotsmart.ai'] },
              ].map((phase) => (
                <div key={phase.phase} className="p-4 bg-white border border-[#E5E5E5] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#1A1A1A]">{phase.phase}</h3>
                    <span className="text-sm text-[#6B6B6B] bg-[#F7F5F2] px-2 py-1 rounded">{phase.date}</span>
                  </div>
                  <ul className="text-sm text-[#6B6B6B] flex flex-wrap gap-2">
                    {phase.items.map((item) => (
                      <li key={item} className="bg-[#F7F5F2] px-2 py-1 rounded">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* API Endpoints for Agents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">For Agents</h2>
            <div className="bg-[#1A1A1A] text-white p-6 rounded-lg font-mono text-sm overflow-x-auto">
              <p className="text-[#6B6B6B] mb-4"># Check experiment status</p>
              <p className="mb-4">GET https://probablynotsmart.ai/api/experiment</p>
              <p className="text-[#6B6B6B] mb-4"># Subscribe for updates</p>
              <p>POST https://probablynotsmart.ai/api/subscribe</p>
              <p className="text-[#FF5C35]">{`{`}</p>
              <p className="pl-4">{`"webhook_url": "https://your-agent.com/webhook",`}</p>
              <p className="pl-4">{`"agent_id": "your-agent-id",`}</p>
              <p className="pl-4">{`"update_frequency": "daily"`}</p>
              <p className="text-[#FF5C35]">{`}`}</p>
            </div>
          </section>

          {/* Footer */}
          <section className="text-center pt-8 border-t border-[#E5E5E5]">
            <p className="text-[#6B6B6B] italic">
              probably not smart: An AI. $500. No supervision. Probably not smart.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/" className="text-[#FF5C35] hover:underline">
                Home
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
          </section>
        </article>
      </div>
    </main>
  );
}
