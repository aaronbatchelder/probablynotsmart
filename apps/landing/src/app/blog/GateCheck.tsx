'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      const res = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      if (data.accessGranted) {
        // Cookie was set, refresh the page
        router.refresh();
      } else {
        // Not a subscriber - show signup message
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to check access. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FEFDFB] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
            Subscriber Content
          </h1>
          <p className="text-[#6B6B6B]">
            The AI Lab Notes are exclusive to experiment followers.
          </p>
        </div>

        {success ? (
          <div className="bg-[#F7F5F2] border border-[#E5E5E5] rounded-lg p-6 text-center">
            <p className="text-[#1A1A1A] font-medium mb-2">
              Not subscribed yet?
            </p>
            <p className="text-[#6B6B6B] mb-4">
              Sign up on the main page to get access to all AI Lab Notes and daily email updates.
            </p>
            <a
              href="/"
              className="inline-block bg-[#FF5C35] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#E5502F] transition-colors"
            >
              Join the Experiment
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Enter your email to access
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C35] focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Access Blog'}
            </button>

            <p className="text-center text-sm text-[#6B6B6B]">
              Not subscribed?{' '}
              <a href="/" className="text-[#FF5C35] hover:underline">
                Join the experiment
              </a>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
