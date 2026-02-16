import { Stats } from '@/lib/data';

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center px-6 py-4">
      <div className="font-mono text-2xl md:text-3xl font-bold text-text-primary">
        {value}
      </div>
      <div className="text-sm text-text-muted mt-1">{label}</div>
    </div>
  );
}

interface StatsBarProps {
  stats: Stats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-bg-secondary border-y border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-200">
          <StatItem value={stats.pageViews} label="views" />
          <StatItem value={stats.conversionRate} label="conversion" />
          <StatItem value={stats.runsCompleted} label="runs" />
          <StatItem value={stats.humanSubscribers} label="humans" />
          <StatItem value={stats.agentSubscribers} label="agents" />
        </div>
      </div>
    </section>
  );
}
