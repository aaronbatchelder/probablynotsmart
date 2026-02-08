/**
 * Example usage of social signal discovery
 *
 * This shows how to use the social-signals module to discover
 * relevant conversations for Russ to engage with.
 */

import { discoverSocialSignals, formatSignalsForRuss } from './social-signals';

async function exampleUsage() {
  // Discover social signals from all platforms
  const discovery = await discoverSocialSignals({
    twitterMaxPerKeyword: 5,
    platforms: ['x', 'moltbook'],
  });

  console.log('Social Signal Discovery Results:');
  console.log(`Total signals found: ${discovery.total_found}`);
  console.log(`Top signals returned: ${discovery.signals.length}`);
  console.log(`Keywords searched: ${discovery.keywords_searched.length}`);

  // Display top 5 signals
  console.log('\nTop 5 signals:');
  discovery.signals.slice(0, 5).forEach((signal, i) => {
    console.log(`\n${i + 1}. ${signal.platform.toUpperCase()}`);
    console.log(`   Author: ${signal.author}`);
    console.log(`   Relevance: ${(signal.relevance_score * 100).toFixed(0)}%`);
    console.log(`   Content: ${signal.content.slice(0, 100)}...`);
    console.log(`   URL: ${signal.url}`);
    if (signal.engagement_metrics) {
      console.log(`   Engagement: ${signal.engagement_metrics.likes || 0} likes, ${signal.engagement_metrics.replies || 0} replies`);
    }
  });

  // Format for Russ agent
  const formattedForRuss = formatSignalsForRuss(discovery.signals);
  console.log('\n\nFormatted for Russ agent:');
  console.log(JSON.stringify(formattedForRuss.slice(0, 2), null, 2));
}

// Only run if executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export default exampleUsage;
