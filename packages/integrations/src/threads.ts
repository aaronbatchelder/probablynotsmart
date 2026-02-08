/**
 * Meta Threads API Integration
 *
 * Uses OAuth 2.0 for authentication via Instagram's authorization flow
 *
 * API Documentation: https://developers.facebook.com/docs/threads
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 * - THREADS_USER_ID: Your Threads user ID (obtained after OAuth)
 * - THREADS_ACCESS_TOKEN: Long-lived access token (obtained via OAuth 2.0 flow)
 *
 * SETUP REQUIREMENTS:
 * 1. Create a Meta/Facebook Developer account at developers.facebook.com
 * 2. Create a new App and enable "Threads API" product
 * 3. Your account must be a verified Business account
 * 4. Complete OAuth 2.0 flow with these scopes:
 *    - threads_basic (read basic profile info)
 *    - threads_content_publish (create and publish posts)
 * 5. Exchange short-lived token for long-lived access token
 *
 * IMPORTANT NOTES:
 * - The Threads API was in limited access as of 2024-2025
 * - You may need to apply for API access through Meta
 * - Posting is a two-step process: create container, then publish
 * - Wait ~30 seconds between container creation and publishing
 * - All media URLs must be publicly accessible
 * - Rate limits apply per the API documentation
 */

const THREADS_USER_ID = process.env.THREADS_USER_ID || '';
const THREADS_ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN || '';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

interface ThreadsErrorResponse {
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

interface CreateContainerResponse extends ThreadsErrorResponse {
  id?: string; // Media container ID
}

interface PublishResponse extends ThreadsErrorResponse {
  id?: string; // Published post ID
}

interface ContainerStatusResponse extends ThreadsErrorResponse {
  status?: string; // "FINISHED" | "IN_PROGRESS" | "ERROR"
  error_message?: string;
}

/**
 * Create a media container for a text post
 * This is step 1 of the posting process
 *
 * @param text The text content of the post (max 500 characters)
 * @returns Container ID if successful, or error
 */
async function createTextContainer(
  text: string
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
    console.warn('[Threads] API credentials not configured');
    return { success: false, error: 'Threads API not configured' };
  }

  const url = `${THREADS_API_BASE}/${THREADS_USER_ID}/threads`;

  try {
    const params = new URLSearchParams({
      media_type: 'TEXT',
      text: text,
      access_token: THREADS_ACCESS_TOKEN,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as CreateContainerResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('[Threads] Container creation failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!data.id) {
      return { success: false, error: 'No container ID returned' };
    }

    console.log(`[Threads] Created container: ${data.id}`);
    return { success: true, containerId: data.id };

  } catch (error) {
    console.error('[Threads] Error creating container:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check the status of a media container
 * Use this to verify the container is ready before publishing
 *
 * @param containerId The media container ID
 * @returns Status information
 */
async function checkContainerStatus(
  containerId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!THREADS_ACCESS_TOKEN) {
    return { success: false, error: 'Threads API not configured' };
  }

  const url = `${THREADS_API_BASE}/${containerId}`;

  try {
    const params = new URLSearchParams({
      fields: 'status,error_message',
      access_token: THREADS_ACCESS_TOKEN,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json() as ContainerStatusResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('[Threads] Status check failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    if (data.status === 'ERROR') {
      return {
        success: false,
        status: 'ERROR',
        error: data.error_message || 'Container processing failed'
      };
    }

    return { success: true, status: data.status };

  } catch (error) {
    console.error('[Threads] Error checking status:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Publish a media container as a Thread post
 * This is step 2 of the posting process
 *
 * @param containerId The media container ID from createTextContainer
 * @returns Post ID and URL if successful
 */
async function publishContainer(
  containerId: string
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
    return { success: false, error: 'Threads API not configured' };
  }

  const url = `${THREADS_API_BASE}/${THREADS_USER_ID}/threads_publish`;

  try {
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: THREADS_ACCESS_TOKEN,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
    });

    const data = await response.json() as PublishResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('[Threads] Publish failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!data.id) {
      return { success: false, error: 'No post ID returned' };
    }

    const postId = data.id;
    // Note: Threads post URLs follow the format: https://www.threads.net/@username/post/{post_id}
    // However, we don't have the username readily available here
    // You may want to store the username or fetch it from the user profile
    const postUrl = `https://www.threads.net/t/${postId}`;

    console.log(`[Threads] Published post: ${postId}`);
    return { success: true, id: postId, url: postUrl };

  } catch (error) {
    console.error('[Threads] Error publishing:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Post text content to Threads
 * Handles the complete two-step process: create container + publish
 *
 * @param text The text content to post (max 500 characters)
 * @param waitForProcessing Whether to wait and verify container is ready (default: true)
 * @returns Post ID and URL if successful
 */
export async function postToThreads(
  text: string,
  waitForProcessing: boolean = true
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  // Step 1: Create container
  const containerResult = await createTextContainer(text);

  if (!containerResult.success || !containerResult.containerId) {
    return {
      success: false,
      error: containerResult.error || 'Failed to create container'
    };
  }

  const containerId = containerResult.containerId;

  // Step 2: Wait for processing (recommended ~30 seconds)
  if (waitForProcessing) {
    console.log('[Threads] Waiting for container to process...');

    // Check status with retries
    const maxRetries = 6; // 6 retries * 10 seconds = 60 seconds max
    const retryDelay = 10000; // 10 seconds

    let attempts = 0;
    let isReady = false;

    while (attempts < maxRetries && !isReady) {
      // Wait before checking (start with a delay)
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      const statusResult = await checkContainerStatus(containerId);

      if (!statusResult.success) {
        return {
          success: false,
          error: `Container status check failed: ${statusResult.error}`
        };
      }

      if (statusResult.status === 'FINISHED') {
        isReady = true;
        console.log('[Threads] Container ready for publishing');
      } else if (statusResult.status === 'ERROR') {
        return {
          success: false,
          error: `Container processing error: ${statusResult.error}`
        };
      } else {
        attempts++;
        console.log(`[Threads] Container still processing... (${attempts}/${maxRetries})`);
      }
    }

    if (!isReady) {
      return {
        success: false,
        error: 'Container processing timeout - try again later'
      };
    }
  }

  // Step 3: Publish container
  const publishResult = await publishContainer(containerId);

  return publishResult;
}

/**
 * Create a media container for a reply to another Thread
 *
 * @param text The reply text
 * @param replyToId The ID of the Thread to reply to
 * @returns Container ID if successful
 */
async function createReplyContainer(
  text: string,
  replyToId: string
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
    console.warn('[Threads] API credentials not configured');
    return { success: false, error: 'Threads API not configured' };
  }

  const url = `${THREADS_API_BASE}/${THREADS_USER_ID}/threads`;

  try {
    const params = new URLSearchParams({
      media_type: 'TEXT',
      text: text,
      reply_to_id: replyToId,
      access_token: THREADS_ACCESS_TOKEN,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as CreateContainerResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('[Threads] Reply container creation failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!data.id) {
      return { success: false, error: 'No container ID returned' };
    }

    console.log(`[Threads] Created reply container: ${data.id}`);
    return { success: true, containerId: data.id };

  } catch (error) {
    console.error('[Threads] Error creating reply container:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reply to a Thread
 * Handles the complete two-step process for replies
 *
 * @param text The reply text
 * @param replyToId The ID of the Thread to reply to
 * @param waitForProcessing Whether to wait for container processing
 * @returns Post ID and URL if successful
 */
export async function replyToThread(
  text: string,
  replyToId: string,
  waitForProcessing: boolean = true
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> {
  // Step 1: Create reply container
  const containerResult = await createReplyContainer(text, replyToId);

  if (!containerResult.success || !containerResult.containerId) {
    return {
      success: false,
      error: containerResult.error || 'Failed to create reply container'
    };
  }

  const containerId = containerResult.containerId;

  // Step 2: Wait for processing if requested
  if (waitForProcessing) {
    console.log('[Threads] Waiting for reply container to process...');

    const maxRetries = 6;
    const retryDelay = 10000;

    let attempts = 0;
    let isReady = false;

    while (attempts < maxRetries && !isReady) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      const statusResult = await checkContainerStatus(containerId);

      if (!statusResult.success) {
        return {
          success: false,
          error: `Container status check failed: ${statusResult.error}`
        };
      }

      if (statusResult.status === 'FINISHED') {
        isReady = true;
      } else if (statusResult.status === 'ERROR') {
        return {
          success: false,
          error: `Container processing error: ${statusResult.error}`
        };
      } else {
        attempts++;
      }
    }

    if (!isReady) {
      return {
        success: false,
        error: 'Reply container processing timeout'
      };
    }
  }

  // Step 3: Publish reply
  const publishResult = await publishContainer(containerId);

  return publishResult;
}

/**
 * Extract Thread ID from URL
 * Threads URLs can be in various formats:
 * - https://www.threads.net/t/{post_id}
 * - https://www.threads.net/@username/post/{post_id}
 */
export function extractThreadId(url: string): string | null {
  // Match patterns like:
  // https://www.threads.net/t/ABC123
  // https://www.threads.net/@username/post/ABC123
  const match = url.match(/threads\.net\/(?:t\/|@[\w.]+\/post\/)([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
