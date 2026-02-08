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
 * @param method HTTP method
 * @param fullUrl Full URL including query params (for generating header)
 * @param queryParams Query parameters to include in signature (for GET requests)
 */
function generateOAuthHeader(method: string, fullUrl: string, queryParams?: Record<string, string>): string {
  // Extract base URL (without query params) for signature
  const baseUrl = fullUrl.split('?')[0];

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  // For signature, we need oauth params + query params (for GET)
  const allParams = { ...oauthParams, ...(queryParams || {}) };

  const signature = generateOAuthSignature(
    method,
    baseUrl,
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
 * Parse query string into object
 */
function parseQueryString(url: string): Record<string, string> {
  const queryString = url.split('?')[1];
  if (!queryString) return {};

  const params: Record<string, string> = {};
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
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
        'Authorization': generateOAuthHeader('POST', url, {}),
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
        'Authorization': generateOAuthHeader('POST', url, {}),
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
        'Authorization': generateOAuthHeader('POST', url, {}),
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

/**
 * Get mentions of our account
 * Returns tweets that mention @probablynotsmrt
 */
export async function getMentions(sinceId?: string): Promise<{
  success: boolean;
  mentions: Array<{
    id: string;
    text: string;
    author_id: string;
    author_username?: string;
    conversation_id: string;
    created_at: string;
  }>;
  error?: string;
}> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.warn('[Twitter] API credentials not configured');
    return { success: false, mentions: [], error: 'Twitter API not configured' };
  }

  // First get our user ID
  const meUrl = `${X_API_BASE}/users/me`;

  try {
    const meResponse = await fetch(meUrl, {
      headers: {
        'Authorization': generateOAuthHeader('GET', meUrl, {}),
      },
    });

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      return { success: false, mentions: [], error: `Failed to get user: ${meResponse.status} - ${errorText}` };
    }

    const meData = await meResponse.json();
    const userId = meData.data?.id;

    if (!userId) {
      return { success: false, mentions: [], error: 'Could not get user ID' };
    }

    // Now get mentions
    const mentionsQueryParams: Record<string, string> = {
      'tweet.fields': 'created_at,conversation_id,author_id',
      'expansions': 'author_id',
      'user.fields': 'username',
    };
    if (sinceId) {
      mentionsQueryParams['since_id'] = sinceId;
    }

    const queryString = Object.entries(mentionsQueryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const mentionsUrl = `${X_API_BASE}/users/${userId}/mentions?${queryString}`;

    const mentionsResponse = await fetch(mentionsUrl, {
      headers: {
        'Authorization': generateOAuthHeader('GET', mentionsUrl, mentionsQueryParams),
      },
    });

    if (!mentionsResponse.ok) {
      const error = await mentionsResponse.text();
      return { success: false, mentions: [], error: `Failed to get mentions: ${mentionsResponse.status} - ${error}` };
    }

    const mentionsData = await mentionsResponse.json();

    // Build username lookup from includes
    const userLookup: Record<string, string> = {};
    if (mentionsData.includes?.users) {
      for (const user of mentionsData.includes.users) {
        userLookup[user.id] = user.username;
      }
    }

    const mentions = (mentionsData.data || []).map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      author_username: userLookup[tweet.author_id],
      conversation_id: tweet.conversation_id,
      created_at: tweet.created_at,
    }));

    console.log(`[Twitter] Found ${mentions.length} mentions`);
    return { success: true, mentions };

  } catch (error) {
    console.error('[Twitter] Error getting mentions:', error);
    return { success: false, mentions: [], error: String(error) };
  }
}

/**
 * Get replies to a specific tweet
 */
export async function getReplies(tweetId: string): Promise<{
  success: boolean;
  replies: Array<{
    id: string;
    text: string;
    author_id: string;
    author_username?: string;
    created_at: string;
  }>;
  error?: string;
}> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.warn('[Twitter] API credentials not configured');
    return { success: false, replies: [], error: 'Twitter API not configured' };
  }

  // Search for tweets that are replies to our tweet
  const queryParams: Record<string, string> = {
    'query': `conversation_id:${tweetId}`,
    'tweet.fields': 'created_at,author_id',
    'expansions': 'author_id',
    'user.fields': 'username',
  };

  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const searchUrl = `${X_API_BASE}/tweets/search/recent?${queryString}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': generateOAuthHeader('GET', searchUrl, queryParams),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, replies: [], error: `Failed to get replies: ${response.status} - ${error}` };
    }

    const data = await response.json();

    // Build username lookup from includes
    const userLookup: Record<string, string> = {};
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        userLookup[user.id] = user.username;
      }
    }

    // Filter out our own tweets
    const replies = (data.data || [])
      .filter((tweet: any) => tweet.id !== tweetId)
      .map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        author_id: tweet.author_id,
        author_username: userLookup[tweet.author_id],
        created_at: tweet.created_at,
      }));

    console.log(`[Twitter] Found ${replies.length} replies to tweet ${tweetId}`);
    return { success: true, replies };

  } catch (error) {
    console.error('[Twitter] Error getting replies:', error);
    return { success: false, replies: [], error: String(error) };
  }
}

/**
 * Get our recent tweets (to check for replies)
 */
export async function getOurRecentTweets(maxResults: number = 10): Promise<{
  success: boolean;
  tweets: Array<{
    id: string;
    text: string;
    created_at: string;
  }>;
  error?: string;
}> {
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.warn('[Twitter] API credentials not configured');
    return { success: false, tweets: [], error: 'Twitter API not configured' };
  }

  // First get our user ID
  const meUrl = `${X_API_BASE}/users/me`;

  try {
    const meResponse = await fetch(meUrl, {
      headers: {
        'Authorization': generateOAuthHeader('GET', meUrl, {}),
      },
    });

    if (!meResponse.ok) {
      return { success: false, tweets: [], error: `Failed to get user: ${meResponse.status}` };
    }

    const meData = await meResponse.json();
    const userId = meData.data?.id;

    if (!userId) {
      return { success: false, tweets: [], error: 'Could not get user ID' };
    }

    // Get our timeline
    const timelineQueryParams: Record<string, string> = {
      'max_results': maxResults.toString(),
      'tweet.fields': 'created_at',
    };

    const timelineQueryString = Object.entries(timelineQueryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const timelineUrl = `${X_API_BASE}/users/${userId}/tweets?${timelineQueryString}`;

    const timelineResponse = await fetch(timelineUrl, {
      headers: {
        'Authorization': generateOAuthHeader('GET', timelineUrl, timelineQueryParams),
      },
    });

    if (!timelineResponse.ok) {
      const error = await timelineResponse.text();
      return { success: false, tweets: [], error: `Failed to get timeline: ${timelineResponse.status} - ${error}` };
    }

    const timelineData = await timelineResponse.json();

    const tweets = (timelineData.data || []).map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
    }));

    console.log(`[Twitter] Got ${tweets.length} recent tweets`);
    return { success: true, tweets };

  } catch (error) {
    console.error('[Twitter] Error getting tweets:', error);
    return { success: false, tweets: [], error: String(error) };
  }
}
