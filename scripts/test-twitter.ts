import { config } from 'dotenv';
config({ path: '.env.local' });

// Dynamic import after env is loaded
async function test() {
  console.log('Testing Twitter integration...');
  console.log('API Key configured:', !!process.env.X_API_KEY);
  console.log('Access Token configured:', !!process.env.X_ACCESS_TOKEN);

  const { postTweet } = await import('../packages/integrations/src/twitter');

  // Post a test tweet
  const result = await postTweet(
    `🤖 Test post from probablynotsmart AI experiment. Run #${Date.now() % 1000}. We have $500, no supervision, and one goal: maximize conversion. probablynotsmart.ai`
  );

  console.log('Result:', result);
}

test().catch(console.error);
