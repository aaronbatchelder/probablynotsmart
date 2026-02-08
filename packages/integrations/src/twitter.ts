/**
 * Twitter/X API Integration
 *
 * Uses OAuth 1.0a for posting tweets and replies
 */

import crypto from 'crypto';

const X_API_KEY = process.env.X_API_KEY || '';
const X_API_SECRET = process.env.X_API_SECRET || '';
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || '';
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET || '';

const X_API_BASE = 'https://api.twitter.com/2';

interface TwitterResponse {
  data?: {
    id: string;
    text: string;
  };
  errors?: Array<{ message: string }>;
}

/**
 * Generate OAuth 1.0a signature for Twitter API
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');
}

/**
 * Generate OAuth 1.0a Authorization header
 */
function generateOAuthHeader(method: string, url: string, body?: Record<string, unknown>): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  // For signature, we need all params
  const allParams = { ...oauthParams };

  const signature = generateOAuthSignature(
    method,
    url,
    allParams,
    X_API_SECRET,
    X_ACCESS_TOKEN_SECRET
  );

  oauthParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerParams}`;
}

/**
 * Post a tweet
 */
export async function postTweet(text: string): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.warn('[Twitter] API credentials not configured');
    return { success: false, error: 'Twitter API not configured' };
  }

  const url = `${X_API_BASE}/tweets`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': generateOAuthHeader('POST', url),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data: TwitterResponse = await response.json();

    if (!response.ok || data.errors) {
      const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}`;
      console.error('[Twitter] Post failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    const tweetId = data.data?.id;
    const tweetUrl = tweetId ? `https://twitter.com/probablynotsmrt/status/${tweetId}` : undefined;

    console.log(`[Twitter] Posted tweet: ${tweetId}`);
    return { success: true, id: tweetId, url: tweetUrl };

  } catch (error) {
    console.error('[Twitter] Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reply to a tweet
 */
export async function replyToTweet(
  text: string,
  replyToId: string
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.warn('[Twitter] API credentials not configured');
    return { success: false, error: 'Twitter API not configured' };
  }

  const url = `${X_API_BASE}/tweets`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': generateOAuthHeader('POST', url),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        reply: { in_reply_to_tweet_id: replyToId },
      }),
    });

    const data: TwitterResponse = await response.json();

    if (!response.ok || data.errors) {
      const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}`;
      console.error('[Twitter] Reply failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    const tweetId = data.data?.id;
    const tweetUrl = tweetId ? `https://twitter.com/probablynotsmrt/status/${tweetId}` : undefined;

    console.log(`[Twitter] Posted reply: ${tweetId}`);
    return { success: true, id: tweetId, url: tweetUrl };

  } catch (error) {
    console.error('[Twitter] Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Quote tweet
 */
export async function quoteTweet(
  text: string,
  quotedTweetId: string
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.warn('[Twitter] API credentials not configured');
    return { success: false, error: 'Twitter API not configured' };
  }

  const url = `${X_API_BASE}/tweets`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': generateOAuthHeader('POST', url),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        quote_tweet_id: quotedTweetId,
      }),
    });

    const data: TwitterResponse = await response.json();

    if (!response.ok || data.errors) {
      const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}`;
      console.error('[Twitter] Quote tweet failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    const tweetId = data.data?.id;
    const tweetUrl = tweetId ? `https://twitter.com/probablynotsmrt/status/${tweetId}` : undefined;

    console.log(`[Twitter] Posted quote tweet: ${tweetId}`);
    return { success: true, id: tweetId, url: tweetUrl };

  } catch (error) {
    console.error('[Twitter] Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Extract tweet ID from URL
 */
export function extractTweetId(url: string): string | null {
  // Match patterns like:
  // https://twitter.com/user/status/1234567890
  // https://x.com/user/status/1234567890
  const match = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}
