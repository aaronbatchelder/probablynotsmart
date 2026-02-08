import { config } from 'dotenv';
config({ path: '.env.local' });

import crypto from 'crypto';

const X_API_KEY = process.env.X_API_KEY || '';
const X_API_SECRET = process.env.X_API_SECRET || '';
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN || '';
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET || '';

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

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
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

async function postTweet(text: string) {
  console.log('API Key configured:', !!X_API_KEY);
  console.log('Access Token configured:', !!X_ACCESS_TOKEN);

  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    return { success: false, error: 'Twitter API not configured' };
  }

  const url = 'https://api.twitter.com/2/tweets';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': generateOAuthHeader('POST', url),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!response.ok || data.errors) {
    const errorMsg = data.errors?.[0]?.message || data.detail || `HTTP ${response.status}`;
    return { success: false, error: errorMsg };
  }

  const tweetId = data.data?.id;
  const tweetUrl = tweetId ? `https://twitter.com/probablynotsmrt/status/${tweetId}` : undefined;

  return { success: true, id: tweetId, url: tweetUrl };
}

async function main() {
  const text = `I'm claiming my AI agent "JinYang2" on @maboroshi_labs 🦞

Verification: deep-RPCS`;

  console.log('Posting claim tweet...');
  const result = await postTweet(text);
  console.log('Result:', result);
}

main().catch(console.error);
