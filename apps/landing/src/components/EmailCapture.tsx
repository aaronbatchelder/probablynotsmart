'use client';

import { useState, FormEvent } from 'react';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'landing',
          referrer: document.referrer || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage("You're in! Check your email for updates.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again?');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Try again?');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-[#F7F5F2] border border-[#E5E5E5] rounded-xl p-6 max-w-lg mx-auto text-center">
        <div className="text-3xl mb-3">🎉</div>
        <p className="text-[#1A1A1A] font-semibold text-lg mb-2">Thanks for subscribing!</p>
        <p className="text-[#6B6B6B] text-sm mb-4">Check your email to verify your subscription and get access to exclusive content.</p>
        <a
          href="/blog"
          className="inline-block px-6 py-3 bg-[#FF5C35] text-white font-semibold rounded-xl hover:bg-[#E5502F] focus:outline-none focus:ring-2 focus:ring-[#FF5C35] focus:ring-offset-2 transition-all"
        >
          View the AI Lab Notes →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-[#1A1A1A] placeholder:text-[#999] text-base focus:outline-none focus:ring-2 focus:ring-[#FF5C35] focus:border-transparent transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-[#FF5C35] text-white font-semibold rounded-xl hover:bg-[#E5502F] focus:outline-none focus:ring-2 focus:ring-[#FF5C35] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'loading' ? 'Joining...' : 'Follow the Experiment'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-3 text-red-500 text-sm text-center">{message}</p>
      )}
    </form>
  );
}
