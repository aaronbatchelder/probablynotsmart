# LinkedIn API Integration Setup

This guide explains how to set up LinkedIn API credentials for posting content as Russ (the AI agent) to LinkedIn.

## Overview

The LinkedIn integration uses OAuth 2.0 for authentication and the REST Posts API for creating posts. LinkedIn provides 60-day access tokens that need to be refreshed before expiration.

## Required Credentials

You need three environment variables:

```bash
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ACCESS_TOKEN=your-access-token
```

Optional (for OAuth flow):
```bash
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback
```

## Step-by-Step Setup

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the required information:
   - **App name**: "Probably Not Smart" (or your preferred name)
   - **LinkedIn Page**: Associate with a LinkedIn company page (required)
   - **Privacy policy URL**: Your privacy policy URL
   - **App logo**: Upload a logo (optional but recommended)
4. Review and create the app

### 2. Request API Access

After creating the app, you need to request access to specific products:

1. In your app dashboard, go to the "Products" tab
2. Request access to these products:
   - **"Share on LinkedIn"** - Provides the `w_member_social` scope for posting
   - **"Sign In with LinkedIn using OpenID Connect"** - Provides `openid` and `profile` scopes
3. Wait for approval (usually instant for Share on LinkedIn, may take time for others)

### 3. Configure OAuth Settings

1. Go to the "Auth" tab in your app dashboard
2. Under "OAuth 2.0 settings":
   - Add **Redirect URLs**: Add your callback URL (e.g., `http://localhost:3000/auth/linkedin/callback` for development)
3. Note your **Client ID** and **Client Secret** - you'll need these

### 4. Get OAuth Scopes

Your app needs these scopes:
- `openid` - For user identification
- `profile` - For user profile data
- `w_member_social` - For posting content

### 5. Obtain an Access Token

#### Option A: Manual Authorization Flow (Recommended for Initial Setup)

1. Use the helper function to generate the authorization URL:

```typescript
import { getLinkedInAuthUrl } from '@probablynotsmart/integrations';

const authUrl = getLinkedInAuthUrl('random-state-string');
console.log('Visit this URL:', authUrl);
```

2. Visit the URL in a browser
3. Authorize the application
4. LinkedIn will redirect to your redirect URI with a `code` parameter
5. Exchange the code for an access token:

```typescript
import { getLinkedInAccessToken } from '@probablynotsmart/integrations';

const result = await getLinkedInAccessToken('authorization-code-from-callback');
if (result.success) {
  console.log('Access Token:', result.accessToken);
  console.log('Expires in:', result.expiresIn, 'seconds (60 days)');
}
```

#### Option B: Using curl (for testing)

1. Generate authorization URL manually:
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=openid%20profile%20w_member_social
```

2. After authorization, exchange code for token:
```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

### 6. Add Credentials to Environment

Add the credentials to your `.env.local` file:

```bash
LINKEDIN_CLIENT_ID=your-client-id-here
LINKEDIN_CLIENT_SECRET=your-client-secret-here
LINKEDIN_ACCESS_TOKEN=your-access-token-here
```

## Using the Integration

### Post to LinkedIn

```typescript
import { postToLinkedIn } from '@probablynotsmart/integrations';

const result = await postToLinkedIn('Hello LinkedIn! This is Russ posting.');

if (result.success) {
  console.log('Posted successfully!');
  console.log('Post ID:', result.id);
  console.log('Post URL:', result.url);
} else {
  console.error('Failed to post:', result.error);
}
```

### Get User Information

```typescript
import { getLinkedInUserInfo } from '@probablynotsmart/integrations';

const result = await getLinkedInUserInfo();

if (result.success) {
  console.log('User ID:', result.userId);
  console.log('User Info:', result.userInfo);
}
```

### Refresh Access Token

LinkedIn tokens expire after 60 days. To refresh:

```typescript
import { refreshLinkedInAccessToken } from '@probablynotsmart/integrations';

const result = await refreshLinkedInAccessToken('your-refresh-token');

if (result.success) {
  console.log('New Access Token:', result.accessToken);
  // Update your environment variable with the new token
}
```

## API Details

### LinkedIn API Version

The integration uses API version `202301` (January 2023). This is specified in the `LinkedIn-Version` header.

### Rate Limits

LinkedIn enforces rate limits on API requests:
- Each application has a daily request limit
- Exceeding limits results in a 429 error
- Monitor your usage to stay within limits

### Post Response

When creating a post, LinkedIn returns:
- HTTP 201 status on success
- Post ID in the `x-restli-id` response header (format: `urn:li:share:1234567890` or `urn:li:ugcPost:1234567890`)

## Troubleshooting

### Error: "LinkedIn access token not configured"
- Make sure `LINKEDIN_ACCESS_TOKEN` is set in your environment variables
- Check that the token hasn't expired (60-day lifetime)

### Error: "Failed to get user info"
- Verify your access token is valid
- Check that you have the `openid` and `profile` scopes

### Error: "HTTP 403" or "ACCESS_DENIED"
- Verify your app has the "Share on LinkedIn" product approved
- Check that you have the `w_member_social` scope
- Make sure you're using `/v2/userinfo` not `/rest/userinfo` for user info

### Error: "HTTP 401" or "Unauthorized"
- Your access token may have expired (60-day limit)
- Use the refresh token flow to get a new access token
- Re-authorize if the refresh token is also expired

## Documentation Links

- [LinkedIn OAuth 2.0 Authorization Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-01)
- [LinkedIn Sign In with OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [LinkedIn API FAQ](https://developer.linkedin.com/support/faq)

## Security Notes

1. **Never commit credentials**: Keep your client secret and access tokens out of version control
2. **Use environment variables**: Always load credentials from environment variables
3. **Rotate tokens regularly**: Refresh your access token before the 60-day expiration
4. **Use HTTPS**: Always use HTTPS for OAuth callbacks in production
5. **Validate state parameter**: Use the state parameter for CSRF protection during OAuth flow

## Token Management Best Practices

1. **Monitor expiration**: LinkedIn tokens last 60 days - set up monitoring
2. **Implement refresh logic**: Automatically refresh tokens before they expire
3. **Store refresh tokens securely**: Keep refresh tokens encrypted at rest
4. **Handle failures gracefully**: Implement retry logic with exponential backoff
5. **Log token events**: Track when tokens are refreshed or when refreshes fail
