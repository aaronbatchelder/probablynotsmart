/**
 * LinkedIn Integration Examples
 *
 * This file shows how to use the LinkedIn integration for posting content.
 * Make sure you have the required environment variables set before running.
 */

import {
  postToLinkedIn,
  getLinkedInUserInfo,
  getLinkedInAuthUrl,
  getLinkedInAccessToken,
  refreshLinkedInAccessToken
} from '../src/linkedin';

/**
 * Example 1: Post a simple text update to LinkedIn
 */
async function examplePostToLinkedIn() {
  console.log('Example 1: Posting to LinkedIn...');

  const result = await postToLinkedIn(
    'Hello LinkedIn! This is an automated post from Russ, the AI marketing agent. 🤖'
  );

  if (result.success) {
    console.log('✅ Post successful!');
    console.log('Post ID:', result.id);
    console.log('Post URL:', result.url);
  } else {
    console.error('❌ Post failed:', result.error);
  }
}

/**
 * Example 2: Get user information
 */
async function exampleGetUserInfo() {
  console.log('\nExample 2: Getting user info...');

  const result = await getLinkedInUserInfo();

  if (result.success) {
    console.log('✅ User info retrieved!');
    console.log('User ID:', result.userId);
    console.log('Name:', result.userInfo?.name);
    console.log('Email:', result.userInfo?.email);
  } else {
    console.error('❌ Failed to get user info:', result.error);
  }
}

/**
 * Example 3: Complete OAuth flow (manual steps)
 *
 * This shows the full OAuth flow for getting an access token.
 * In production, you'd implement this as web endpoints.
 */
async function exampleOAuthFlow() {
  console.log('\nExample 3: OAuth Flow...');

  // Step 1: Generate authorization URL
  const state = Math.random().toString(36).substring(7);
  const authUrl = getLinkedInAuthUrl(state);

  console.log('Step 1: Visit this URL to authorize:');
  console.log(authUrl);
  console.log('\nAfter authorization, LinkedIn will redirect to your callback URL with a code parameter.');
  console.log('Copy that code and use it in Step 2.');

  // Step 2: Exchange code for access token (you need to get the code from callback)
  // Uncomment and replace with actual code from callback:
  /*
  const authCode = 'paste-authorization-code-here';
  const tokenResult = await getLinkedInAccessToken(authCode);

  if (tokenResult.success) {
    console.log('\n✅ Step 2: Access token obtained!');
    console.log('Access Token:', tokenResult.accessToken);
    console.log('Expires in:', tokenResult.expiresIn, 'seconds');
    console.log('\nAdd this to your .env.local:');
    console.log(`LINKEDIN_ACCESS_TOKEN=${tokenResult.accessToken}`);
  } else {
    console.error('❌ Failed to get access token:', tokenResult.error);
  }
  */
}

/**
 * Example 4: Refresh an expired access token
 *
 * LinkedIn tokens last 60 days. Use this to refresh before expiration.
 */
async function exampleRefreshToken() {
  console.log('\nExample 4: Refresh access token...');

  // Replace with your actual refresh token
  const refreshToken = 'your-refresh-token-here';

  const result = await refreshLinkedInAccessToken(refreshToken);

  if (result.success) {
    console.log('✅ Token refreshed!');
    console.log('New Access Token:', result.accessToken);
    console.log('Expires in:', result.expiresIn, 'seconds');
    console.log('\nUpdate your .env.local with the new token.');
  } else {
    console.error('❌ Failed to refresh token:', result.error);
  }
}

/**
 * Example 5: Post with a specific user ID
 *
 * If you already have the user's person URN, you can pass it directly
 */
async function examplePostWithUserId() {
  console.log('\nExample 5: Posting with specific user ID...');

  // First get the user ID
  const userResult = await getLinkedInUserInfo();
  if (!userResult.success || !userResult.userId) {
    console.error('❌ Failed to get user ID');
    return;
  }

  // Then post with that user ID
  const result = await postToLinkedIn(
    'This post was created by specifying the author ID explicitly!',
    `urn:li:person:${userResult.userId}`
  );

  if (result.success) {
    console.log('✅ Post successful with user ID!');
    console.log('Post ID:', result.id);
  } else {
    console.error('❌ Post failed:', result.error);
  }
}

/**
 * Run all examples (comment out the ones you don't want to run)
 */
async function main() {
  console.log('LinkedIn Integration Examples\n');
  console.log('='.repeat(50));

  // Check if credentials are configured
  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    console.error('\n❌ LINKEDIN_ACCESS_TOKEN not found in environment variables!');
    console.log('\nPlease set up your credentials first:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Follow LINKEDIN_SETUP.md to get your credentials');
    console.log('3. Add LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_ACCESS_TOKEN');
    return;
  }

  try {
    // Example 1: Simple post
    await examplePostToLinkedIn();

    // Example 2: Get user info
    await exampleGetUserInfo();

    // Example 3: OAuth flow (manual - see function comments)
    await exampleOAuthFlow();

    // Example 4: Refresh token (uncomment if you have a refresh token)
    // await exampleRefreshToken();

    // Example 5: Post with user ID
    await examplePostWithUserId();

    console.log('\n' + '='.repeat(50));
    console.log('Examples completed!');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  examplePostToLinkedIn,
  exampleGetUserInfo,
  exampleOAuthFlow,
  exampleRefreshToken,
  examplePostWithUserId,
};
