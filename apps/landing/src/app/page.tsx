import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';
import HowItWorks from '@/components/HowItWorks';
import LatestActivity from '@/components/LatestActivity';
import BudgetTracker from '@/components/BudgetTracker';
import ForAgents from '@/components/ForAgents';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getStats, getBudgetStatus, getSubscriberCount, getLatestRun } from '@/lib/data';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Fetch all data in parallel
  const [stats, budgetStatus, subscriberCount, latestRun] = await Promise.all([
    getStats(),
    getBudgetStatus(),
    getSubscriberCount(),
    getLatestRun(),
  ]);

  return (
    <main className="min-h-screen">
      <AnalyticsTracker />
      <Hero subscriberCount={subscriberCount} />
      <StatsBar stats={stats} />
      <HowItWorks />
      <LatestActivity latestRun={latestRun} />
      <BudgetTracker budget={budgetStatus} />
      <ForAgents />
      <FinalCTA />
      <Footer />
    </main>
  );
}
