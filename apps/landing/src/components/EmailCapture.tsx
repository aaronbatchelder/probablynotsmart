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
      <div className="bg-bg-secondary rounded-lg p-6 max-w-md mx-auto">
        <p className="text-text-primary font-medium">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-8 py-4 bg-accent-primary text-white font-medium rounded-lg hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Joining...' : 'Follow the Experiment'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-3 text-red-500 text-sm">{message}</p>
      )}
    </form>
  );
}
