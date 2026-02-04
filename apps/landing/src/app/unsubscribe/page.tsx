'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. Please use the link from your email.');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || "You've been unsubscribed.");
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to unsubscribe. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#FEFDFB] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'idle' && (
          <>
            <div className="text-6xl mb-6">👋</div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Unsubscribe
            </h1>
            <p className="text-[#6B6B6B] mb-8">
              Sorry to see you go. Click below to unsubscribe from probablynotsmart emails.
            </p>
            <button
              onClick={handleUnsubscribe}
              className="bg-[#1A1A1A] text-white font-medium px-8 py-4 rounded-lg hover:bg-[#333] transition-colors"
            >
              Unsubscribe Me
            </button>
            <p className="text-sm text-[#6B6B6B] mt-6">
              Changed your mind?{' '}
              <Link href="/" className="text-[#FF5C35] hover:underline">
                Go back to the experiment
              </Link>
            </p>
          </>
        )}

        {status === 'loading' && (
          <>
            <div className="text-6xl mb-6">⏳</div>
            <p className="text-[#6B6B6B]">Processing...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Unsubscribed
            </h1>
            <p className="text-[#6B6B6B] mb-8">{message}</p>
            <p className="text-sm text-[#6B6B6B]">
              The AI will miss you. Probably.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 text-[#FF5C35] hover:underline"
            >
              ← Back to probablynotsmart
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Oops
            </h1>
            <p className="text-[#6B6B6B] mb-8">{message}</p>
            <Link
              href="/"
              className="inline-block text-[#FF5C35] hover:underline"
            >
              ← Back to probablynotsmart
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#FEFDFB] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">⏳</div>
        <p className="text-[#6B6B6B]">Loading...</p>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnsubscribeContent />
    </Suspense>
  );
}
