# Threads API Integration

A TypeScript integration for posting content to Meta's Threads platform via their official API.

## Features

- Post text content to Threads
- Reply to existing Threads
- Automatic container creation and publishing workflow
- Built-in retry logic for container processing
- Comprehensive error handling
- Thread ID extraction from URLs

## Quick Start

### Installation

The Threads integration is part of the `@probablynotsmart/integrations` package:

```typescript
import { postToThreads, replyToThread } from '@probablynotsmart/integrations';
```

### Environment Variables

Set these in your `.env` file:

```bash
THREADS_USER_ID=your_threads_user_id
THREADS_ACCESS_TOKEN=your_long_lived_access_token
```

See [THREADS_SETUP.md](./THREADS_SETUP.md) for detailed instructions on obtaining these credentials.

## Usage Examples

### Posting a Simple Text Thread

```typescript
import { postToThreads } from '@probablynotsmart/integrations';

const result = await postToThreads('Hello, Threads! This is my first post.');

if (result.success) {
  console.log(`Posted successfully!`);
  console.log(`Post ID: ${result.id}`);
  console.log(`URL: ${result.url}`);
} else {
  console.error(`Failed to post: ${result.error}`);
}
```

### Replying to a Thread

```typescript
import { replyToThread } from '@probablynotsmart/integrations';

const threadId = '1234567890'; // ID of the thread to reply to

const result = await replyToThread(
  'Great post! Thanks for sharing.',
  threadId
);

if (result.success) {
  console.log(`Reply posted: ${result.url}`);
}
```

### Extracting Thread ID from URL

```typescript
import { extractThreadId } from '@probablynotsmart/integrations';

const url1 = 'https://www.threads.net/t/ABC123xyz';
const id1 = extractThreadId(url1); // 'ABC123xyz'

const url2 = 'https://www.threads.net/@username/post/DEF456uvw';
const id2 = extractThreadId(url2); // 'DEF456uvw'
```

### Posting Without Wait (Advanced)

By default, the integration waits for container processing before publishing. You can skip this:

```typescript
const result = await postToThreads(
  'Quick post!',
  false // Don't wait for processing
);
```

**Warning**: Publishing without waiting may fail if the container isn't ready. Only use this if you know what you're doing.

## API Reference

### `postToThreads(text, waitForProcessing?)`

Posts text content to Threads.

**Parameters:**
- `text` (string): The text content to post (max 500 characters)
- `waitForProcessing` (boolean, optional): Whether to wait for container processing (default: true)

**Returns:**
```typescript
Promise<{
  success: boolean;
  id?: string;        // Post ID if successful
  url?: string;       // Post URL if successful
  error?: string;     // Error message if failed
}>
```

### `replyToThread(text, replyToId, waitForProcessing?)`

Replies to an existing Thread.

**Parameters:**
- `text` (string): The reply text (max 500 characters)
- `replyToId` (string): The ID of the Thread to reply to
- `waitForProcessing` (boolean, optional): Whether to wait for container processing (default: true)

**Returns:**
```typescript
Promise<{
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}>
```

### `extractThreadId(url)`

Extracts the Thread ID from a Threads URL.

**Parameters:**
- `url` (string): A Threads URL

**Returns:**
- `string | null`: The Thread ID, or null if not found

**Supported URL formats:**
- `https://www.threads.net/t/{post_id}`
- `https://www.threads.net/@username/post/{post_id}`

## How It Works

The Threads API requires a two-step publishing process:

1. **Create Container**: First, create a media container with your content
2. **Publish Container**: After processing (~30 seconds), publish the container

This integration handles both steps automatically:

```typescript
// Under the hood:
// 1. Create container
const container = await createTextContainer(text);

// 2. Wait for processing (with retries)
while (status !== 'FINISHED') {
  await sleep(10000);
  status = await checkContainerStatus(container.id);
}

// 3. Publish
const post = await publishContainer(container.id);
```

The waiting period includes:
- 6 retry attempts
- 10 second intervals
- Status checks for 'FINISHED', 'IN_PROGRESS', or 'ERROR'
- Maximum 60 second timeout

## Error Handling

The integration provides detailed error messages:

```typescript
const result = await postToThreads('My post');

if (!result.success) {
  switch (result.error) {
    case 'Threads API not configured':
      // Missing environment variables
      break;
    case 'Container processing timeout':
      // Container took too long to process
      break;
    default:
      // API error or network issue
      console.error(result.error);
  }
}
```

## Limitations

- **Character Limit**: 500 characters per post
- **Media Processing**: ~30 seconds wait time required
- **Rate Limits**: Varies by app tier (check `/me/threads_publishing_limit`)
- **OAuth**: Access tokens expire after 60 days and must be refreshed
- **API Access**: May require approval from Meta (limited access as of 2024-2025)

## Best Practices

1. **Store Credentials Securely**: Never commit tokens to version control
2. **Handle Errors Gracefully**: Always check `result.success` before proceeding
3. **Respect Rate Limits**: Implement exponential backoff for 429 errors
4. **Refresh Tokens**: Set up automated token refresh every 50-55 days
5. **Monitor Quotas**: Check publishing limits via the API
6. **Wait for Processing**: Use the default `waitForProcessing: true` unless you have a specific reason not to

## Troubleshooting

### "Threads API not configured"

Ensure you've set `THREADS_USER_ID` and `THREADS_ACCESS_TOKEN` in your `.env` file.

### "Container processing timeout"

The container took longer than 60 seconds to process. Try:
- Simplifying your content
- Checking your internet connection
- Retrying after a few minutes

### "No container ID returned"

The API didn't return a container ID. Possible causes:
- Invalid credentials
- Rate limit exceeded
- Content validation failed
- API service issues

### Token Expired

Long-lived tokens expire after 60 days. Generate a new token using the refresh flow documented in [THREADS_SETUP.md](./THREADS_SETUP.md).

## Development

The integration is written in TypeScript and follows these patterns:

- Async/await for all API calls
- Explicit error handling with detailed messages
- Type-safe interfaces for all API responses
- Consistent return format across all functions
- Built-in retry logic for robustness

## Related Files

- `/Users/aaronbatchelder/probably-not-smart/packages/integrations/src/threads.ts` - Main implementation
- `/Users/aaronbatchelder/probably-not-smart/packages/integrations/THREADS_SETUP.md` - Setup guide
- `/Users/aaronbatchelder/probably-not-smart/packages/integrations/src/twitter.ts` - Similar integration for reference

## Additional Resources

- [Official Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Meta Developer Platform](https://developers.facebook.com)
- [OAuth 2.0 Specification](https://oauth.net/2/)

## Support

For issues specific to this integration, check:
1. Your environment variables are correctly set
2. Your access token hasn't expired
3. You haven't exceeded rate limits
4. The Threads API service is operational

For Meta Threads API issues, consult:
- [Meta Developer Forums](https://developers.facebook.com/community/)
- [Threads API Changelog](https://www.threads.com/@threadsapi.changelog)
