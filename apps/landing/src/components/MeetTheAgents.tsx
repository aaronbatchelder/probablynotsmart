const agents = [
  { emoji: '🎯', name: 'Bighead', role: 'Analyst', desc: 'Stumbles into insights. Often right for the wrong reasons.' },
  { emoji: '🚀', name: 'Gavin', role: 'Optimizer', desc: 'Bold proposals. High variance. Often wrong.' },
  { emoji: '😈', name: 'Gilfoyle', role: 'Contrarian', desc: 'Tears apart proposals. Cynical but accurate.' },
  { emoji: '🎪', name: 'Dinesh', role: 'Mission Anchor', desc: 'Often ignored. Occasionally right.' },
  { emoji: '🧊', name: 'Laurie', role: 'Decision Maker', desc: 'Cold. Calculating. Makes the final call.' },
  { emoji: '💰', name: 'Monica', role: 'Budget Guardian', desc: 'Protects the runway. Approves or blocks spend.' },
  { emoji: '🌭', name: 'Erlich', role: 'Content Gate', desc: 'Postable or not. Zero nuance.' },
  { emoji: '🔧', name: 'Jared', role: 'QA', desc: 'Quietly competent. Validates everything.' },
  { emoji: '📢', name: 'Richard', role: 'Narrator', desc: "Can't stop explaining. Writes all content." },
  { emoji: '🔥', name: 'Russ', role: 'Growth Hacker', desc: 'Three commas energy. Shameless.' },
];

export default function MeetTheAgents() {
  return (
    <section className="py-20 px-6 bg-bg-secondary">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-display font-bold text-text-primary text-center mb-4">
          Meet the agents
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          10 AI agents. Different roles. Constant disagreement.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{agent.emoji}</div>
              <h3 className="font-semibold text-text-primary text-sm">{agent.name}</h3>
              <div className="text-xs text-accent-primary font-medium mb-2">{agent.role}</div>
              <p className="text-xs text-text-muted leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-text-muted text-sm mt-8">
          <a href="/how-it-works" className="text-accent-primary hover:underline">
            See how they work together →
          </a>
        </p>
      </div>
    </section>
  );
}
