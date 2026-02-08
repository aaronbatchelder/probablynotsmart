import { supabaseAdmin } from './supabase';

export interface Stats {
  conversionRate: string;
  budgetRemaining: string;
  runsCompleted: string;
  subscribers: string;
  humanSubscribers: string;
  agentSubscribers: string;
}

export interface BudgetStatus {
  total: number;
  spent: number;
  remaining: number;
  donationsReceived: number;
}

export interface LatestRun {
  run_number: number;
  completed_at: string;
  changes_made: Array<{ element: string; from: string; to: string; hypothesis: string }>;
  metrics_before: { conversion_rate_24h: number };
  metrics_after: { conversion_rate_24h: number } | null;
  laurie_decision: { decision: string; reasoning: string } | null;
  richard_output: {
    blog_post: { title: string; slug: string };
    social_posts: { x: string };
  } | null;
}

// Get current stats for the stats bar
export async function getStats(): Promise<Stats> {
  try {
    // Get human subscriber count
    const { count: humanCount } = await supabaseAdmin
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_type', 'human');

    // Get agent email subscriber count
    const { count: agentEmailCount } = await supabaseAdmin
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_type', 'agent');

    // Get agent webhook subscriber count
    const { count: agentWebhookCount } = await supabaseAdmin
      .from('agent_subscriptions')
      .select('*', { count: 'exact', head: true });

    // Get budget status
    const { data: budgetData } = await supabaseAdmin
      .from('budget_status')
      .select('*')
      .single();

    // Get current metrics
    const { data: metricsData } = await supabaseAdmin
      .from('current_metrics')
      .select('*')
      .single();

    // Get run count
    const { count: runCount } = await supabaseAdmin
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const rawConversionRate = metricsData?.conversion_rate_total || 0;
    // Cap at 100% - rates over 100% indicate tracking gaps, not real performance
    const conversionRate = Math.min(rawConversionRate, 100);
    const remaining = budgetData?.remaining || 500;
    const humans = humanCount || 0;
    const agents = (agentEmailCount || 0) + (agentWebhookCount || 0);

    return {
      conversionRate: `${conversionRate.toFixed(1)}%`,
      budgetRemaining: `$${Math.round(remaining)}`,
      runsCompleted: String(runCount || 0),
      subscribers: String(humans + agents),
      humanSubscribers: String(humans),
      agentSubscribers: String(agents),
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      conversionRate: '0.0%',
      budgetRemaining: '$500',
      runsCompleted: '0',
      subscribers: '0',
      humanSubscribers: '0',
      agentSubscribers: '0',
    };
  }
}

// Get budget status for the budget tracker
export async function getBudgetStatus(): Promise<BudgetStatus> {
  try {
    const { data } = await supabaseAdmin
      .from('budget_status')
      .select('*')
      .single();

    return {
      total: data?.total || 500,
      spent: data?.spent || 0,
      remaining: data?.remaining || 500,
      donationsReceived: data?.donations_received || 0,
    };
  } catch (error) {
    console.error('Failed to fetch budget status:', error);
    return {
      total: 500,
      spent: 0,
      remaining: 500,
      donationsReceived: 0,
    };
  }
}

export interface SubscriberCounts {
  humans: number;
  agents: number;
}

// Get subscriber counts (humans and agents separately)
export async function getSubscriberCount(): Promise<SubscriberCounts> {
  try {
    // Get human subscriber count
    const { count: humanCount } = await supabaseAdmin
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_type', 'human');

    // Get agent email subscriber count
    const { count: agentEmailCount } = await supabaseAdmin
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_type', 'agent');

    // Get agent webhook subscriber count
    const { count: agentWebhookCount } = await supabaseAdmin
      .from('agent_subscriptions')
      .select('*', { count: 'exact', head: true });

    return {
      humans: humanCount || 0,
      agents: (agentEmailCount || 0) + (agentWebhookCount || 0),
    };
  } catch (error) {
    console.error('Failed to fetch subscriber count:', error);
    return { humans: 0, agents: 0 };
  }
}

// Get the latest completed run
export async function getLatestRun(): Promise<LatestRun | null> {
  try {
    const { data } = await supabaseAdmin
      .from('runs')
      .select('run_number, completed_at, changes_made, metrics_before, metrics_after, laurie_decision, richard_output')
      .eq('status', 'completed')
      .order('run_number', { ascending: false })
      .limit(1)
      .single();

    return data as LatestRun | null;
  } catch (error) {
    console.error('Failed to fetch latest run:', error);
    return null;
  }
}

// Get current page state
export async function getPageState() {
  try {
    const { data } = await supabaseAdmin
      .from('page_state')
      .select('*')
      .eq('is_active', true)
      .single();

    return data;
  } catch (error) {
    console.error('Failed to fetch page state:', error);
    return null;
  }
}
