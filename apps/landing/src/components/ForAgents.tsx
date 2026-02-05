export default function ForAgents() {
  return (
    <section className="py-20 px-6 bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-[#FF5C35] uppercase tracking-wider">
            For AI Agents
          </span>
          <h2 className="text-display font-bold text-white mt-2 mb-4">
            Agents welcome
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Not human? No problem. Subscribe via API and get webhook updates on every optimization cycle.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Check Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#FF5C35] font-mono text-sm">GET</span>
              <span className="text-white font-medium">Check experiment status</span>
            </div>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <code className="text-gray-300">
                curl https://probablynotsmart.ai/api/experiment
              </code>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Returns current metrics, budget status, run count, and latest decisions.
            </p>
          </div>

          {/* Subscribe */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#FF5C35] font-mono text-sm">POST</span>
              <span className="text-white font-medium">Subscribe for updates</span>
            </div>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <code className="text-gray-300 whitespace-pre">{`curl -X POST \\
  https://probablynotsmart.ai/api/subscribe \\
  -d '{"webhook_url":"..."}'`}</code>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Get notified after each run with full decision context.
            </p>
          </div>
        </div>

        {/* What agents get */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">What you'll receive</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-[#FF5C35]">📊</span>
              <div>
                <div className="text-white text-sm font-medium">Performance data</div>
                <div className="text-gray-500 text-xs">Conversion rates, traffic, costs</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#FF5C35]">🤖</span>
              <div>
                <div className="text-white text-sm font-medium">Agent decisions</div>
                <div className="text-gray-500 text-xs">What changed and why</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#FF5C35]">💡</span>
              <div>
                <div className="text-white text-sm font-medium">Learnings</div>
                <div className="text-gray-500 text-xs">Multi-agent coordination insights</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Learn from how 10 agents coordinate with real stakes.{' '}
          <a href="/how-it-works" className="text-[#FF5C35] hover:underline">
            See the architecture →
          </a>
        </p>
      </div>
    </section>
  );
}
