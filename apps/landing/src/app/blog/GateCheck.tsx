'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Sample preview content to show what's behind the gate
const PREVIEW_POSTS = [
  {
    title: "Run #1: The AI Makes Its First Move",
    excerpt: "Gavin proposed removing the hero image entirely. Gilfoyle called it 'the dumbest idea since blockchain voting.' Here's what happened...",
    type: "run-recap",
  },
  {
    title: "The Great Button Color Debate of 2026",
    excerpt: "Three agents spent 47 API calls arguing about whether orange or red converts better. The data had 2 clicks.",
    type: "behind-scenes",
  },
  {
    title: "Why Laurie Rejected the 'URGENCY REVOLUTION'",
    excerpt: "Gavin wanted countdown timers, flashing text, and a popup that screamed 'LAST CHANCE.' Laurie said no. Here's the full debate...",
    type: "decision",
  },
];

export default function GateCheck() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try to sign up (will also grant access if already subscribed)
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog-gate' }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Already subscribed - try to get access
        const accessRes = await fetch('/api/auth/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const accessData = await accessRes.json();

        if (accessData.accessGranted) {
          router.refresh();
          return;
        }
      }

      if (!res.ok && res.status !== 409) {
        setError(data.error || 'Something went wrong');
        return;
      }

      // New signup or existing - refresh to show blog
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Failed to sign up. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FEFDFB] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            The AI Lab Notes
          </h1>
          <p className="text-[#6B6B6B]">
            Every decision, every debate, every disaster. Documented.
          </p>
        </div>

        {/* Preview Cards */}
        <div className="mb-12">
          <h2 className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wide mb-4">
            Preview what's inside
          </h2>
          <div className="space-y-4">
            {PREVIEW_POSTS.map((post, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E5E5] rounded-lg p-5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/80 pointer-events-none" />
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono bg-[#F7F5F2] text-[#6B6B6B] px-2 py-1 rounded shrink-0">
                    {post.type === 'run-recap' ? '📊 Run Recap' :
                     post.type === 'behind-scenes' ? '🎬 Behind Scenes' : '⚖️ Decision'}
                  </span>
                </div>
                <h3 className="font-bold text-[#1A1A1A] mt-3 mb-2">{post.title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-[#F7F5F2] border border-[#E5E5E5] rounded-xl p-6">
          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-[#1A1A1A] font-medium mb-2">
                You're in!
              </p>
              <p className="text-[#6B6B6B] text-sm">
                Loading the AI Lab Notes...
              </p>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-[#1A1A1A] text-center text-xl mb-2">
                Get full access
              </h3>
              <p className="text-[#6B6B6B] text-sm text-center mb-4">
                Join the experiment to unlock all AI Lab Notes + daily email updates
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C35] focus:border-transparent bg-white text-center"
                />

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF5C35] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#E5502F] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join the Experiment'}
                </button>
              </form>

              <p className="text-xs text-[#6B6B6B] text-center mt-4">
                Free. Unsubscribe anytime. No spam, just AI chaos.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
