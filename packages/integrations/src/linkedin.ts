/**
 * LinkedIn API Integration
 *
 * Uses OAuth 2.0 for posting content to LinkedIn
 *
 * Required Credentials:
 * - LINKEDIN_CLIENT_ID: Your LinkedIn app's client ID
 * - LINKEDIN_CLIENT_SECRET: Your LinkedIn app's client secret
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token (obtained via 3-legged OAuth flow)
 *
 * To obtain credentials:
 * 1. Create a LinkedIn App at https://www.linkedin.com/developers/apps
 * 2. Request access to "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" products
 * 3. Add OAuth 2.0 scopes: openid, profile, w_member_social
 * 4. Complete the 3-legged OAuth flow to get an access token
 *
 * API Documentation:
 * - OAuth: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 * - Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 */

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || '';
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/auth/linkedin/callback';

const LINKEDIN_API_BASE = 'https://api.linkedin.com';
const LINKEDIN_API_VERSION = '202301'; // YYYYMM format

interface LinkedInPostResponse {
  id?: string;
  error?: {
    message: string;
    status: number;
  };
}

interface LinkedInUserInfo {
  sub?: string; // LinkedIn person ID
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
}

/**
 * Get LinkedIn user information from the userinfo endpoint
 * Returns the user's person ID needed for posting
 */
export async function getLinkedInUserInfo(): Promise<{
  success: boolean;
  userId?: string;
  userInfo?: LinkedInUserInfo;
  error?: string;
}> {
  if (!LINKEDIN_ACCESS_TOKEN) {
    console.warn('[LinkedIn] Access token not configured');
    return { success: false, error: 'LinkedIn access token not configured' };
  }

  try {
    const response = await fetch(`${LINKEDIN_API_BASE}/v2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn] Failed to get user info:', response.status, errorText);
      return { success: false, error: `Failed to get user info: ${response.status}` };
    }

    const userInfo = await response.json() as LinkedInUserInfo;

    if (!userInfo.sub) {
      return { success: false, error: 'No user ID in response' };
    }

    console.log(`[LinkedIn] Got user info for: ${userInfo.name || userInfo.sub}`);
    return { success: true, userId: userInfo.sub, userInfo };

  } catch (error) {
    console.error('[LinkedIn] Error getting user info:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Post content to LinkedIn
 * @param text The text content of the post
 * @param authorId Optional: The person URN (urn:li:person:ID). If not provided, will fetch from userinfo endpoint
 */
export async function postToLinkedIn(
  text: string,
  authorId?: string
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  if (!LINKEDIN_ACCESS_TOKEN) {
    console.warn('[LinkedIn] Access token not configured');
    return { success: false, error: 'LinkedIn access token not configured' };
  }

  try {
    // Get author ID if not provided
    let personUrn = authorId;
    if (!personUrn) {
      const userInfoResult = await getLinkedInUserInfo();
      if (!userInfoResult.success || !userInfoResult.userId) {
        return { success: false, error: userInfoResult.error || 'Failed to get user ID' };
      }
      personUrn = `urn:li:person:${userInfoResult.userId}`;
    }

    // Ensure personUrn is in correct format
    if (!personUrn.startsWith('urn:li:person:')) {
      personUrn = `urn:li:person:${personUrn}`;
    }

    const postData = {
      author: personUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const response = await fetch(`${LINKEDIN_API_BASE}/rest/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn] Post failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    // LinkedIn returns the post ID in the x-restli-id header
    const postId = response.headers.get('x-restli-id');

    if (!postId) {
      console.warn('[LinkedIn] Post created but no ID in response');
      return { success: true, error: 'Post created but no ID returned' };
    }

    // Extract the numeric ID from URN (e.g., urn:li:share:1234567890)
    const idMatch = postId.match(/(\d+)$/);
    const numericId = idMatch ? idMatch[1] : null;

    // LinkedIn post URLs - note: the URL format may vary
    // For now, we don't have a reliable way to construct the public URL
    const postUrl = numericId
      ? `https://www.linkedin.com/feed/update/${postId}`
      : undefined;

    console.log(`[LinkedIn] Posted successfully: ${postId}`);
    return { success: true, id: postId, url: postUrl };

  } catch (error) {
    console.error('[LinkedIn] Error posting:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generate the LinkedIn OAuth authorization URL
 * This is the first step in the 3-legged OAuth flow
 * @param state Optional state parameter for CSRF protection
 * @returns Authorization URL to redirect user to
 */
export function getLinkedInAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    scope: 'openid profile w_member_social',
  });

  if (state) {
    params.append('state', state);
  }

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * This is the second step in the 3-legged OAuth flow
 * @param code Authorization code from LinkedIn callback
 */
export async function getLinkedInAccessToken(code: string): Promise<{
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    console.warn('[LinkedIn] Client credentials not configured');
    return { success: false, error: 'LinkedIn client credentials not configured' };
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
      redirect_uri: LINKEDIN_REDIRECT_URI,
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn] Token exchange failed:', response.status, errorText);
      return { success: false, error: `Failed to exchange code: ${response.status}` };
    }

    const data = await response.json() as { access_token?: string; expires_in?: number };

    if (!data.access_token) {
      return { success: false, error: 'No access token in response' };
    }

    console.log('[LinkedIn] Successfully obtained access token');
    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in, // Token expires in 60 days
    };

  } catch (error) {
    console.error('[LinkedIn] Error exchanging code for token:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Refresh an expired access token
 * Note: LinkedIn tokens last 60 days and need to be refreshed before expiration
 * @param refreshToken The refresh token obtained during initial authorization
 */
export async function refreshLinkedInAccessToken(refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    console.warn('[LinkedIn] Client credentials not configured');
    return { success: false, error: 'LinkedIn client credentials not configured' };
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn] Token refresh failed:', response.status, errorText);
      return { success: false, error: `Failed to refresh token: ${response.status}` };
    }

    const data = await response.json() as { access_token?: string; expires_in?: number };

    if (!data.access_token) {
      return { success: false, error: 'No access token in response' };
    }

    console.log('[LinkedIn] Successfully refreshed access token');
    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };

  } catch (error) {
    console.error('[LinkedIn] Error refreshing token:', error);
    return { success: false, error: String(error) };
  }
}
