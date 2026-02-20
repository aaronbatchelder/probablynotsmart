import { BetaAnalyticsDataClient } from '@google-analytics/data';

const GA4_PROPERTY_ID = '523637941';

// Initialize GA4 client - requires GOOGLE_APPLICATION_CREDENTIALS env var
// or GOOGLE_CREDENTIALS (JSON string) for Vercel
let ga4Client: BetaAnalyticsDataClient | null = null;

function getGA4Client(): BetaAnalyticsDataClient | null {
  if (ga4Client) return ga4Client;

  try {
    // Check for credentials JSON string (for Vercel deployment)
    const credentialsJson = process.env.GOOGLE_CREDENTIALS;
    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson);
      ga4Client = new BetaAnalyticsDataClient({ credentials });
      return ga4Client;
    }

    // Fall back to GOOGLE_APPLICATION_CREDENTIALS file path
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      ga4Client = new BetaAnalyticsDataClient();
      return ga4Client;
    }

    console.warn('GA4: No credentials configured');
    return null;
  } catch (error) {
    console.error('GA4: Failed to initialize client:', error);
    return null;
  }
}

export async function getGA4PageViews(): Promise<number | null> {
  const client = getGA4Client();
  if (!client) return null;

  try {
    const [response] = await client.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '2024-01-01', endDate: 'today' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    if (response.rows && response.rows[0]) {
      return parseInt(response.rows[0].metricValues![0].value!, 10);
    }
    return 0;
  } catch (error) {
    console.error('GA4: Failed to fetch page views:', error);
    return null;
  }
}
