/**
 * Example: Using Threads API Integration for AI Agent Posting
 *
 * This example demonstrates how Russ (AI agent) could use the Threads integration
 * to post marketing content and engage with the community.
 */

import { postToThreads, replyToThread, extractThreadId } from '../src/threads';

/**
 * Example 1: Post a marketing update
 */
async function postMarketingUpdate() {
  console.log('Posting marketing update to Threads...');

  const result = await postToThreads(
    'Just shipped a new feature! Our AI agents are now collaborating in real-time. ' +
    'The future of autonomous systems is here. 🤖✨'
  );

  if (result.success) {
    console.log(`✅ Posted successfully!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${result.url}`);
    return result;
  } else {
    console.error(`❌ Failed to post: ${result.error}`);
    return null;
  }
}

/**
 * Example 2: Post a thought leadership piece
 */
async function postThoughtLeadership() {
  const content = `The most interesting thing about AI agents isn't their autonomy—it's how they collaborate.

When agents share context and learn from each other, magic happens.

We're just scratching the surface.`;

  console.log('Posting thought leadership content...');

  const result = await postToThreads(content);

  if (result.success) {
    console.log(`✅ Posted: ${result.url}`);
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }

  return result;
}

/**
 * Example 3: Reply to community feedback
 */
async function replyToCommunity() {
  // In practice, you'd get this ID from monitoring mentions or comments
  const threadIdToReplyTo = '1234567890';

  console.log('Replying to community feedback...');

  const result = await replyToThread(
    'Thanks for the feedback! We\'re working on this feature now. ' +
    'Should ship next week. Stay tuned! 🚀',
    threadIdToReplyTo
  );

  if (result.success) {
    console.log(`✅ Reply posted: ${result.url}`);
  } else {
    console.error(`❌ Failed to reply: ${result.error}`);
  }

  return result;
}

/**
 * Example 4: Extract Thread ID from URL
 */
async function handleThreadUrl() {
  // Example: Someone mentioned us in a thread
  const mentionUrl = 'https://www.threads.net/@someuser/post/ABC123xyz';

  const threadId = extractThreadId(mentionUrl);

  if (threadId) {
    console.log(`Found Thread ID: ${threadId}`);

    // Now reply to it
    const result = await replyToThread(
      'Thanks for mentioning us! 🙏',
      threadId
    );

    if (result.success) {
      console.log(`✅ Replied to mention`);
    }
  } else {
    console.error('Could not extract Thread ID from URL');
  }
}

/**
 * Example 5: Error handling and retry logic
 */
async function postWithRetry(text: string, maxRetries = 3) {
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxRetries}...`);

    const result = await postToThreads(text);

    if (result.success) {
      console.log(`✅ Posted successfully on attempt ${attempts}`);
      return result;
    }

    // Check if error is retryable
    if (result.error?.includes('timeout') || result.error?.includes('network')) {
      console.log(`Retryable error, waiting before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000 * attempts)); // Exponential backoff
    } else {
      console.error(`Non-retryable error: ${result.error}`);
      break;
    }
  }

  console.error(`❌ Failed after ${attempts} attempts`);
  return null;
}

/**
 * Example 6: Daily content schedule for AI agent
 */
async function dailyContentSchedule() {
  console.log('Running daily content schedule...');

  const contentQueue = [
    { time: '09:00', text: 'Good morning! What are you building today? 💡' },
    { time: '14:00', text: 'Afternoon thought: The best code is the code you don\'t have to write. Abstraction is everything.' },
    { time: '18:00', text: 'Weekly recap: This week our agents processed 10k+ tasks autonomously. The experiment continues! 📊' },
  ];

  // In practice, you'd schedule these with a cron job or queue
  for (const content of contentQueue) {
    console.log(`\n[${content.time}] Posting scheduled content...`);
    await postToThreads(content.text);
    // Wait a bit between posts to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

/**
 * Example 7: Content validation before posting
 */
async function postWithValidation(text: string) {
  // Validate content before posting
  const MAX_LENGTH = 500;
  const MIN_LENGTH = 10;

  if (text.length > MAX_LENGTH) {
    console.error(`❌ Content too long: ${text.length} chars (max ${MAX_LENGTH})`);
    return { success: false, error: 'Content exceeds maximum length' };
  }

  if (text.length < MIN_LENGTH) {
    console.error(`❌ Content too short: ${text.length} chars (min ${MIN_LENGTH})`);
    return { success: false, error: 'Content below minimum length' };
  }

  // Check for problematic content
  const bannedWords = ['spam', 'scam']; // Example
  const hasProblematicContent = bannedWords.some(word =>
    text.toLowerCase().includes(word)
  );

  if (hasProblematicContent) {
    console.error('❌ Content contains problematic words');
    return { success: false, error: 'Content validation failed' };
  }

  // All checks passed, post it
  console.log('✅ Content validated, posting...');
  return await postToThreads(text);
}

/**
 * Example 8: Tracking posted content
 */
interface PostRecord {
  id: string;
  url: string;
  text: string;
  timestamp: Date;
}

const postedContent: PostRecord[] = [];

async function postAndTrack(text: string) {
  const result = await postToThreads(text);

  if (result.success && result.id && result.url) {
    const record: PostRecord = {
      id: result.id,
      url: result.url,
      text: text,
      timestamp: new Date(),
    };

    postedContent.push(record);
    console.log(`✅ Posted and tracked: ${record.id}`);
    console.log(`   Total posts: ${postedContent.length}`);

    // In practice, you'd save this to a database
    // await saveToDatabase(record);
  }

  return result;
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('=== Threads API Integration Examples ===\n');

  // Check if credentials are configured
  if (!process.env.THREADS_USER_ID || !process.env.THREADS_ACCESS_TOKEN) {
    console.error('❌ Threads API credentials not configured');
    console.log('Set THREADS_USER_ID and THREADS_ACCESS_TOKEN in your .env file');
    return;
  }

  try {
    // Example 1: Simple post
    await postMarketingUpdate();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 2: Thought leadership
    await postThoughtLeadership();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 3: Reply to community
    // await replyToCommunity(); // Uncomment when you have a real thread ID

    // Example 4: Extract thread ID
    await handleThreadUrl();

    // Example 5: Post with retry logic
    await postWithRetry('Testing retry logic! 🔄');

    // Example 7: Post with validation
    await postWithValidation('This is a validated post that checks length and content.');

    // Example 8: Post and track
    await postAndTrack('Tracking this post for analytics! 📈');

    console.log('\n=== Examples complete ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples for use elsewhere
export {
  postMarketingUpdate,
  postThoughtLeadership,
  replyToCommunity,
  handleThreadUrl,
  postWithRetry,
  dailyContentSchedule,
  postWithValidation,
  postAndTrack,
};

// Run if executed directly
if (require.main === module) {
  runExamples();
}
