# Threads API Setup Guide

This guide explains how to set up Meta's Threads API for posting content programmatically.

## Overview

The Threads API uses OAuth 2.0 authentication through Instagram's authorization flow. It's built on Meta's Graph API infrastructure and requires a Business account.

## Prerequisites

1. A Meta/Facebook Developer account
2. An Instagram Business or Creator account connected to your Threads account
3. A Threads account (obviously!)
4. API access approval from Meta (the API was in limited access as of 2024-2025)

## Step 1: Create a Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Sign in with your Facebook account
3. Complete developer registration if you haven't already

## Step 2: Create a New App

1. Go to "My Apps" in the Meta Developer dashboard
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - **App Name**: Choose a descriptive name (e.g., "Probably Not Smart Bot")
   - **App Contact Email**: Your email address
5. Click "Create App"

## Step 3: Add Threads API Product

1. In your new app dashboard, find the "Products" section
2. Locate "Threads API" and click "Set Up"
3. This will add the Threads API product to your app

**Important**: The Threads API must be added during app creation or to a new app. Old apps may not have Threads integration available.

## Step 4: Configure App Permissions

1. In your app dashboard, go to "Permissions" or "App Review"
2. Add these permissions:
   - `threads_basic` - Read basic profile information (auto-selected)
   - `threads_content_publish` - Create and publish posts

## Step 5: Apply for API Access (If Required)

As of 2024-2025, the Threads API was in limited access. You may need to:

1. Submit your app for review by Meta
2. Explain your use case for the API
3. Wait for approval (this can take several days to weeks)

Check the current status at [developers.facebook.com/docs/threads](https://developers.facebook.com/docs/threads)

## Step 6: Set Up OAuth 2.0

### 6.1 Configure OAuth Redirect URI

1. In your app dashboard, go to "Settings" > "Basic"
2. Scroll to "Add Platform"
3. Select "Website"
4. Enter your OAuth redirect URI (e.g., `https://yourdomain.com/auth/threads/callback`)

### 6.2 Generate Authorization URL

Create an authorization URL with the following format:

```
https://www.threads.net/oauth/authorize
  ?client_id={YOUR_APP_ID}
  &redirect_uri={YOUR_REDIRECT_URI}
  &scope=threads_basic,threads_content_publish
  &response_type=code
```

Replace:
- `{YOUR_APP_ID}` - Your app's App ID from the dashboard
- `{YOUR_REDIRECT_URI}` - URL-encoded redirect URI you configured

### 6.3 Complete Authorization

1. Visit the authorization URL in a browser
2. Log in with the Instagram account connected to your Threads profile
3. Grant the requested permissions
4. You'll be redirected to your redirect URI with an authorization code

### 6.4 Exchange Code for Access Token

Make a POST request to exchange the authorization code for an access token:

```bash
curl -X POST 'https://graph.threads.net/oauth/access_token' \
  -F 'client_id={YOUR_APP_ID}' \
  -F 'client_secret={YOUR_APP_SECRET}' \
  -F 'grant_type=authorization_code' \
  -F 'redirect_uri={YOUR_REDIRECT_URI}' \
  -F 'code={AUTHORIZATION_CODE}'
```

Response will include:
```json
{
  "access_token": "short_lived_token_here",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 6.5 Exchange for Long-Lived Token

Short-lived tokens expire in 1 hour. Exchange for a long-lived token (60 days):

```bash
curl -X GET 'https://graph.threads.net/access_token' \
  -d 'grant_type=th_exchange_token' \
  -d 'client_secret={YOUR_APP_SECRET}' \
  -d 'access_token={SHORT_LIVED_TOKEN}'
```

Response:
```json
{
  "access_token": "long_lived_token_here",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

### 6.6 Get Your Threads User ID

Fetch your Threads user ID using the access token:

```bash
curl -X GET 'https://graph.threads.net/v1.0/me?fields=id,username' \
  -H 'Authorization: Bearer {LONG_LIVED_TOKEN}'
```

Response:
```json
{
  "id": "1234567890",
  "username": "your_username"
}
```

## Step 7: Configure Environment Variables

Add these environment variables to your `.env` file:

```bash
# Threads API Credentials
THREADS_USER_ID=your_threads_user_id_here
THREADS_ACCESS_TOKEN=your_long_lived_access_token_here
```

**Security Notes:**
- Never commit your access token to version control
- Keep your app secret secure
- Rotate tokens periodically
- Long-lived tokens expire after 60 days and must be refreshed

## Step 8: Refresh Long-Lived Tokens

Long-lived tokens expire after 60 days. Refresh them before expiry:

```bash
curl -X GET 'https://graph.threads.net/access_token' \
  -d 'grant_type=th_refresh_token' \
  -d 'access_token={CURRENT_LONG_LIVED_TOKEN}'
```

Set up a reminder to refresh your token every 50-55 days.

## Testing Your Integration

Once configured, test the integration:

```typescript
import { postToThreads } from '@probablynotsmart/integrations';

const result = await postToThreads('Hello from the Threads API!');

if (result.success) {
  console.log(`Posted! ID: ${result.id}`);
  console.log(`URL: ${result.url}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

## API Limitations

- **Text Posts**: Maximum 500 characters
- **Media Processing**: Allow ~30 seconds between container creation and publishing
- **Rate Limits**: Vary based on your app's usage tier
- **Content Publishing Limits**: Check `/me/threads_publishing_limit` endpoint for your quotas

## Troubleshooting

### "OAuth2 authentication is not working properly"

- Verify your app has the Threads API product enabled
- Check that your Instagram account is a Business or Creator account
- Ensure the Instagram account is properly linked to your Threads profile
- Verify your redirect URI exactly matches the configured value

### "Container processing timeout"

- Increase the wait time between container creation and publishing
- Check the container status endpoint for error messages
- Ensure any media URLs (if used) are publicly accessible

### "Failed to create container"

- Check that your text is under 500 characters
- Verify your access token hasn't expired
- Check API rate limits via `/me/threads_publishing_limit`
- Review error messages for specific validation issues

## Additional Resources

- [Official Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Threads API Changelog](https://www.threads.com/@threadsapi.changelog)
- [Meta Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [OAuth 2.0 Documentation](https://oauth.net/2/)

## Recent API Updates (2025)

- Support for publish webhooks added
- Poll attachments with `total_votes` field
- Deletion and location search quotas
- User verification field (`is_verified`)
- Topic tags via `topic_tag` parameter
- Spoilers for posts
- Text attachments

Check the official changelog for the latest features and updates.
