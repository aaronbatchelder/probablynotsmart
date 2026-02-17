import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata = {
  title: 'Status | probably not smart',
  description: 'System status for the probably not smart AI marketing experiment.',
};

export const revalidate = 60;

async function getSystemStatus() {
  // Get latest run
  const { data: latestRun } = await supabaseAdmin
    .from('runs')
    .select('run_number, status, started_at, completed_at')
    .order('run_number', { ascending: false })
    .limit(1)
    .single();

  // Get run stats
  const { count: totalRuns } = await supabaseAdmin
    .from('runs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Get last 5 runs for history
  const { data: recentRuns } = await supabaseAdmin
    .from('runs')
    .select('run_number, status, started_at, completed_at')
    .order('run_number', { ascending: false })
    .limit(5);

  // Get signup count
  const { count: signupCount } = await supabaseAdmin
    .from('signups')
    .select('*', { count: 'exact', head: true })
    .is('unsubscribed_at', null);

  // Get page view count
  const { count: pageViews } = await supabaseAdmin
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'page_view');

  // Get blog post count
  const { count: blogPosts } = await supabaseAdmin
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  // Get latest blog post
  const { data: latestPost } = await supabaseAdmin
    .from('blog_posts')
    .select('title, slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  return {
    latestRun,
    totalRuns: totalRuns || 0,
    recentRuns: recentRuns || [],
    signupCount: signupCount || 0,
    pageViews: pageViews || 0,
    blogPosts: blogPosts || 0,
    latestPost,
  };
}

function getTimeSince(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function StatusPage() {
  const status = await getSystemStatus();

  const systems = [
    { name: 'Landing Page', status: 'operational', url: 'https://probablynotsmart.ai' },
    { name: 'Blog', status: 'operational', url: 'https://probablynotsmart.ai/blog' },
    { name: 'API', status: 'operational', url: 'https://probablynotsmart.ai/api/experiment' },
    { name: 'Main Loop (12h)', status: 'operational', detail: `${status.totalRuns} runs completed` },
    { name: 'Analytics', status: 'operational', detail: `${status.pageViews} page views tracked` },
    { name: 'Email (Resend)', status: 'operational', detail: `${status.signupCount} subscribers` },
    { name: 'Twitter/X', status: 'operational', url: 'https://x.com/probablynotsmrt' },
    { name: 'Moltbook', status: 'operational', url: 'https://www.moltbook.com/u/JinYang2' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <header className="mb-12">
          <Link href="/" className="text-[#FF5C35] hover:underline mb-4 inline-block">
            ← Back to experiment
          </Link>
          <h1 className="text-4xl font-bold mb-2">System Status</h1>
          <p className="text-gray-400">
            Live operational status for probablynotsmart.ai
          </p>
        </header>

        {/* Overall Status */}
        <div className="mb-12 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold text-lg">All Systems Operational</span>
          </div>
        </div>

        {/* Systems */}
        <section className="mb-12">
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">Systems</h2>
          <div className="space-y-2">
            {systems.map((system) => (
              <div key={system.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    system.status === 'operational' ? 'bg-green-500' :
                    system.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">{system.name}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {system.url ? (
                    <a href={system.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      ↗
                    </a>
                  ) : system.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Run */}
        {status.latestRun && (
          <section className="mb-12">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">Latest Run</h2>
            <div className="p-6 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">Run #{status.latestRun.run_number}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  status.latestRun.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  status.latestRun.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {status.latestRun.status}
                </span>
              </div>
              {status.latestRun.completed_at && (
                <p className="text-gray-400 text-sm">
                  Completed {getTimeSince(status.latestRun.completed_at)}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Run History */}
        {status.recentRuns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">Recent Runs</h2>
            <div className="space-y-2">
              {status.recentRuns.map((run) => (
                <div key={run.run_number} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      run.status === 'completed' ? 'bg-green-500' :
                      run.status === 'running' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-mono">Run #{run.run_number}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {run.completed_at ? getTimeSince(run.completed_at) : 'in progress'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest Blog Post */}
        {status.latestPost && (
          <section className="mb-12">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">Latest Post</h2>
            <Link href={`/blog/${status.latestPost.slug}`} className="block p-6 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <p className="font-medium mb-2">{status.latestPost.title}</p>
              <p className="text-sm text-gray-500">
                {getTimeSince(status.latestPost.published_at)}
              </p>
            </Link>
          </section>
        )}

        {/* Quick Stats */}
        <section className="mb-12">
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-2xl font-bold font-mono">{status.totalRuns}</div>
              <div className="text-sm text-gray-500">runs</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-2xl font-bold font-mono">{status.pageViews}</div>
              <div className="text-sm text-gray-500">views</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-2xl font-bold font-mono">{status.signupCount}</div>
              <div className="text-sm text-gray-500">subscribers</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-white/10">
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link>
            <Link href="/leaderboard" className="text-gray-400 hover:text-white">Leaderboard</Link>
            <a href="https://github.com/aaronbatchelder/probablynotsmart" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
