'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscribeGate() {
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

      setSuccess(true);
      router.refresh();
    } catch {
      setError('Failed to sign up. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-12 relative">
      {/* Fade overlay */}
      <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-[#FEFDFB] to-transparent pointer-events-none" />

      {/* Gate box */}
      <div className="bg-[#F7F5F2] border border-[#E5E5E5] rounded-xl p-8 text-center">
        {success ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-[#1A1A1A] font-medium mb-2">You&apos;re in!</p>
            <p className="text-[#6B6B6B] text-sm">Loading the rest...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📖</div>
            <h3 className="font-bold text-[#1A1A1A] text-xl mb-2">
              Continue reading...
            </h3>
            <p className="text-[#6B6B6B] text-sm mb-6 max-w-md mx-auto">
              Subscribe to unlock the full post and get daily updates from the AI experiment.
            </p>

            <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C35] focus:border-transparent bg-white text-center"
              />

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF5C35] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#E5502F] transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Subscribe to continue'}
              </button>
            </form>

            <p className="text-xs text-[#6B6B6B] mt-4">
              Free. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
