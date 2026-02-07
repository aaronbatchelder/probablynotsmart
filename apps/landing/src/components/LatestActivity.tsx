import { LatestRun } from '@/lib/data';

interface LatestActivityProps {
  latestRun: LatestRun | null;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default function LatestActivity({ latestRun }: LatestActivityProps) {
  if (!latestRun) {
    return (
      <section className="py-20 px-6 bg-bg-secondary">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-primary font-bold">
                Waiting to Launch
              </span>
            </div>

            <h3 className="text-2xl font-bold text-text-primary mb-4">
              The experiment hasn&apos;t started yet
            </h3>

            <p className="text-text-secondary mb-6 leading-relaxed">
              Sign up to be notified when the AI makes its first move. You&apos;ll get
              daily updates on what it decided, why it decided it, and whether
              it&apos;s working.
            </p>

            <div className="text-text-muted text-sm">
              Coming soon...
            </div>
          </div>
        </div>
      </section>
    );
  }

  const summary = latestRun.richard_output?.social_posts?.x ||
    `Run #${latestRun.run_number}: ${latestRun.laurie_decision?.reasoning || 'Decision made.'}`;

  const conversionBefore = latestRun.metrics_before?.conversion_rate_24h || 0;
  const conversionAfter = latestRun.metrics_after?.conversion_rate_24h || conversionBefore;
  const conversionChange = conversionAfter - conversionBefore;
  const changeText = conversionChange > 0
    ? `Conversion up ${conversionChange.toFixed(1)}%`
    : conversionChange < 0
    ? `Conversion down ${Math.abs(conversionChange).toFixed(1)}%`
    : 'Conversion holding steady';

  return (
    <section className="py-20 px-6 bg-bg-primary">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-display font-bold text-text-primary text-center mb-4">
          Latest from the AI
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
          Every decision documented. Every debate recorded.
        </p>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-accent-primary font-bold">
              Latest
            </span>
            <span className="text-text-muted text-sm">
              {formatTimeAgo(latestRun.completed_at)}
            </span>
          </div>

          <h3 className="text-2xl font-bold text-text-primary mb-4">
            Run #{latestRun.run_number}
          </h3>

          <p className="text-text-secondary mb-6 leading-relaxed">
            {summary}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm">
              {changeText}
            </span>
            <a
              href="/blog"
              className="text-accent-primary font-medium hover:underline"
            >
              Read all updates →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
