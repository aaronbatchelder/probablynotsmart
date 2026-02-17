/**
 * Email Integration (Resend)
 *
 * Handles sending emails to subscribers:
 * - Welcome emails on signup
 * - Daily digest with run updates
 * - Weekly summaries
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'ai@probablynotsmart.ai';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://probablynotsmart.ai';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email via Resend with retry logic for rate limits
 */
export async function sendEmail(options: EmailOptions, retries = 3): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send');
    return { success: false, error: 'Email not configured' };
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `probablynotsmart <${FROM_EMAIL}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.log(`[Email] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        console.error('Resend error:', data);
        return { success: false, error: data.message || 'Failed to send email' };
      }

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Email send error:', error);
      if (attempt === retries - 1) {
        return { success: false, error: String(error) };
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Log an email to the database
 */
export async function logEmail(params: {
  email: string;
  signupId?: string;
  emailType: 'welcome' | 'daily_digest' | 'weekly_digest' | 'magic_link' | 'special';
  subject: string;
  blogPostId?: string;
  runId?: string;
  status: 'pending' | 'sent' | 'failed';
  providerId?: string;
  errorMessage?: string;
}): Promise<void> {
  await supabase.from('email_log').insert({
    email: params.email,
    signup_id: params.signupId,
    email_type: params.emailType,
    subject: params.subject,
    blog_post_id: params.blogPostId,
    run_id: params.runId,
    status: params.status,
    provider: 'resend',
    provider_id: params.providerId,
    error_message: params.errorMessage,
    sent_at: params.status === 'sent' ? new Date().toISOString() : null,
  });
}

/**
 * Send welcome email to new subscriber
 */
export async function sendWelcomeEmail(email: string, accessToken: string): Promise<boolean> {
  const blogUrl = `${SITE_URL}/blog`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FEFDFB; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <h1 style="color: #1A1A1A; font-size: 28px; margin-bottom: 20px;">
      Welcome to the experiment 🤖
    </h1>

    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      You're now following <strong>probablynotsmart</strong> — an autonomous AI marketing experiment where 10 AI agents control a landing page with zero human oversight. Every ad platform rejected us, so we're doing this organically.
    </p>

    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      <strong>What happens next:</strong>
    </p>

    <ul style="color: #1A1A1A; font-size: 16px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
      <li>Every 12 hours, the AI analyzes performance and debates changes</li>
      <li>You'll get daily email updates with what happened</li>
      <li>Access to the full AI Lab Notes (exclusive blog content)</li>
      <li>Screenshots of the AI agents arguing with each other</li>
    </ul>

    <div style="background-color: #F7F5F2; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 12px 0;">
        <strong>Your subscriber access:</strong>
      </p>
      <a href="${blogUrl}" style="display: inline-block; background-color: #FF5C35; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
        Read the AI Lab Notes →
      </a>
    </div>

    <p style="color: #6B6B6B; font-size: 14px; line-height: 1.6;">
      Probably not smart. Definitely interesting.
    </p>

    <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 32px 0;">

    <p style="color: #999; font-size: 12px;">
      You're receiving this because you signed up at probablynotsmart.ai.<br>
      <a href="${SITE_URL}/unsubscribe?token=${accessToken}" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
`;

  const result = await sendEmail({
    to: email,
    subject: "You're in. The AI is watching.",
    html,
  });

  await logEmail({
    email,
    emailType: 'welcome',
    subject: "You're in. The AI is watching.",
    status: result.success ? 'sent' : 'failed',
    providerId: result.id,
    errorMessage: result.error,
  });

  return result.success;
}

/**
 * Send daily digest email with run summary
 */
export async function sendDailyDigest(params: {
  email: string;
  accessToken: string;
  runNumber: number;
  runSummary: string;
  decision: string;
  changes: string[];
  agentHighlights: { agent: string; quote: string }[];
  conversionBefore: number;
  conversionAfter: number | null;
  blogPostSlug?: string;
}): Promise<boolean> {
  const blogUrl = params.blogPostSlug
    ? `${SITE_URL}/blog/${params.blogPostSlug}`
    : `${SITE_URL}/blog`;

  const changesHtml = params.changes.length > 0
    ? params.changes.map(c => `<li style="margin-bottom: 8px;">${c}</li>`).join('')
    : '<li style="color: #6B6B6B;">No changes made this run</li>';

  const highlightsHtml = params.agentHighlights
    .map(h => `
      <div style="background: #F7F5F2; border-left: 3px solid #FF5C35; padding: 12px 16px; margin-bottom: 12px;">
        <strong style="color: #1A1A1A;">${h.agent}:</strong>
        <span style="color: #6B6B6B; font-style: italic;">"${h.quote}"</span>
      </div>
    `)
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FEFDFB; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="background: #1A1A1A; color: white; padding: 8px 16px; border-radius: 4px; display: inline-block; margin-bottom: 20px; font-family: monospace;">
      Run #${params.runNumber}
    </div>

    <h1 style="color: #1A1A1A; font-size: 24px; margin-bottom: 16px;">
      ${params.runSummary}
    </h1>

    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      <strong>Decision:</strong> ${params.decision}
    </p>

    <h2 style="color: #1A1A1A; font-size: 18px; margin-bottom: 12px;">Changes Made</h2>
    <ul style="color: #1A1A1A; font-size: 15px; line-height: 1.6; margin-bottom: 24px; padding-left: 20px;">
      ${changesHtml}
    </ul>

    <h2 style="color: #1A1A1A; font-size: 18px; margin-bottom: 12px;">Agent Highlights</h2>
    ${highlightsHtml}

    <div style="background: #F7F5F2; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 8px 0;">Conversion Rate</p>
      <p style="color: #1A1A1A; font-size: 24px; font-weight: bold; margin: 0;">
        ${params.conversionBefore}% → ${params.conversionAfter !== null ? `${params.conversionAfter}%` : 'pending...'}
      </p>
    </div>

    <a href="${blogUrl}" style="display: inline-block; background-color: #FF5C35; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
      Read Full Run Details →
    </a>

    <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 32px 0;">

    <p style="color: #999; font-size: 12px;">
      You're receiving this because you're following the probablynotsmart experiment.<br>
      <a href="${SITE_URL}/unsubscribe?token=${params.accessToken}" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
`;

  const result = await sendEmail({
    to: params.email,
    subject: `Run #${params.runNumber}: ${params.runSummary}`,
    html,
  });

  await logEmail({
    email: params.email,
    emailType: 'daily_digest',
    subject: `Run #${params.runNumber}: ${params.runSummary}`,
    blogPostSlug: params.blogPostSlug,
    status: result.success ? 'sent' : 'failed',
    providerId: result.id,
    errorMessage: result.error,
  });

  return result.success;
}

/**
 * Send daily digest to all subscribers
 */
export async function sendDailyDigestToAll(params: {
  runNumber: number;
  runSummary: string;
  decision: string;
  changes: string[];
  agentHighlights: { agent: string; quote: string }[];
  conversionBefore: number;
  conversionAfter: number | null;
  blogPostSlug?: string;
}): Promise<{ sent: number; failed: number }> {
  // Get all active subscribers with daily digest enabled
  const { data: subscribers, error } = await supabase
    .from('signups')
    .select('email, access_token, email_preferences')
    .is('unsubscribed_at', null);

  if (error || !subscribers) {
    console.error('Failed to fetch subscribers:', error);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    // Check if subscriber wants daily digests
    const prefs = subscriber.email_preferences || { daily_digest: true };
    if (!prefs.daily_digest) continue;

    const success = await sendDailyDigest({
      email: subscriber.email,
      accessToken: subscriber.access_token,
      ...params,
    });

    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Rate limit: Resend allows 2 req/s, so wait 600ms between emails
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  return { sent, failed };
}

interface Run {
  run_number: number;
  completed_at: string;
  laurie_decision: { decision: string; reasoning: string } | null;
  changes_made: Array<{ element: string; from: string; to: string }> | null;
  metrics_before: { conversion_rate_total: number } | null;
  metrics_after: { conversion_rate_total: number } | null;
  richard_output: {
    blog_post: { title: string; slug: string };
  } | null;
}

/**
 * Get runs from the last 24 hours
 */
async function getRunsLast24Hours(): Promise<Run[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('runs')
    .select('run_number, completed_at, laurie_decision, changes_made, metrics_before, metrics_after, richard_output')
    .eq('status', 'completed')
    .gte('completed_at', twentyFourHoursAgo)
    .order('run_number', { ascending: true });

  if (error) {
    console.error('Failed to fetch runs:', error);
    return [];
  }

  return (data || []) as Run[];
}

/**
 * Get overall experiment stats
 */
async function getExperimentStats(): Promise<{
  totalRuns: number;
  totalApproved: number;
  totalChanges: number;
  conversionRate: number;
  humanSubscribers: number;
  agentSubscribers: number;
  budgetRemaining: number;
}> {
  // Get total runs
  const { count: totalRuns } = await supabase
    .from('runs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Get approved runs
  const { data: approvedData } = await supabase
    .from('runs')
    .select('laurie_decision')
    .eq('status', 'completed');

  const totalApproved = (approvedData || []).filter(
    r => r.laurie_decision?.decision === 'approve'
  ).length;

  // Get total changes
  const { data: changesData } = await supabase
    .from('runs')
    .select('changes_made')
    .eq('status', 'completed');

  const totalChanges = (changesData || []).reduce(
    (sum, r) => sum + (r.changes_made?.length || 0), 0
  );

  // Get current conversion rate
  const { data: metrics } = await supabase
    .from('current_metrics')
    .select('conversion_rate_total')
    .single();

  // Get subscriber counts by type
  const { count: humanSubscribers } = await supabase
    .from('signups')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_type', 'human')
    .is('unsubscribed_at', null);

  const { count: agentSubscribers } = await supabase
    .from('signups')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_type', 'agent')
    .is('unsubscribed_at', null);

  // Get budget
  const { data: budget } = await supabase
    .from('budget_status')
    .select('remaining')
    .single();

  return {
    totalRuns: totalRuns || 0,
    totalApproved,
    totalChanges,
    conversionRate: metrics?.conversion_rate_total || 0,
    humanSubscribers: humanSubscribers || 0,
    agentSubscribers: agentSubscribers || 0,
    budgetRemaining: budget?.remaining || 500,
  };
}

/**
 * Send 24-hour digest email covering all runs from the past day
 */
export async function send24HourDigest(): Promise<{ sent: number; failed: number; skipped: boolean }> {
  console.log('[Email] Starting 24-hour digest...');

  // Get runs from last 24 hours
  const runs = await getRunsLast24Hours();

  if (runs.length === 0) {
    console.log('[Email] No runs in last 24 hours, skipping digest');
    return { sent: 0, failed: 0, skipped: true };
  }

  console.log(`[Email] Found ${runs.length} runs in last 24 hours`);

  // Get overall experiment stats
  const stats = await getExperimentStats();
  console.log(`[Email] Stats: ${stats.totalRuns} total runs, ${stats.humanSubscribers} humans, ${stats.agentSubscribers} agents`);

  // Build summary of all runs
  const runSummaries = runs.map(run => {
    const decision = run.laurie_decision?.decision || 'unknown';
    const reasoning = run.laurie_decision?.reasoning || '';
    const changes = run.changes_made || [];
    const blogTitle = run.richard_output?.blog_post?.title || 'Run update';
    const blogSlug = run.richard_output?.blog_post?.slug;

    // Create a TL;DR from the reasoning (first sentence or first 100 chars)
    let tldr = reasoning.split('.')[0];
    if (tldr.length > 120) {
      tldr = tldr.slice(0, 117) + '...';
    }

    return {
      runNumber: run.run_number,
      decision,
      reasoning: tldr,
      changesCount: changes.length,
      blogTitle,
      blogSlug,
      conversionBefore: run.metrics_before?.conversion_rate_total || 0,
      conversionAfter: run.metrics_after?.conversion_rate_total || null,
    };
  });

  // Get all active subscribers
  const { data: subscribers, error } = await supabase
    .from('signups')
    .select('email, access_token, email_preferences')
    .is('unsubscribed_at', null);

  if (error || !subscribers) {
    console.error('[Email] Failed to fetch subscribers:', error);
    return { sent: 0, failed: 0, skipped: false };
  }

  console.log(`[Email] Sending to ${subscribers.length} subscribers`);

  // Build the digest email HTML - run summaries with TL;DR
  const runsHtml = runSummaries.map(run => `
    <div style="background: #F7F5F2; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="background: #1A1A1A; color: white; padding: 6px 14px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: 600;">
          Run #${run.runNumber}
        </span>
        <span style="font-size: 14px; font-weight: 500; ${run.decision === 'approve' ? 'color: #22C55E;' : run.decision === 'reject' ? 'color: #EF4444;' : 'color: #F59E0B;'}">
          ${run.decision === 'approve' ? '✓ Approved' : run.decision === 'reject' ? '✗ Rejected' : '⏸ Hold'}
        </span>
      </div>
      <p style="color: #1A1A1A; font-size: 17px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.4;">
        ${run.blogTitle}
      </p>
      ${run.reasoning ? `
        <p style="color: #6B6B6B; font-size: 14px; margin: 0 0 12px 0; line-height: 1.5; font-style: italic;">
          "${run.reasoning}"
        </p>
      ` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E5E5;">
        <span style="color: #6B6B6B; font-size: 13px;">
          ${run.changesCount} change${run.changesCount !== 1 ? 's' : ''}
        </span>
        ${run.blogSlug ? `
          <a href="${SITE_URL}/blog/${run.blogSlug}" style="color: #FF5C35; font-size: 13px; text-decoration: none; font-weight: 600;">
            Read full post →
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');

  const todayChanges = runSummaries.reduce((sum, r) => sum + r.changesCount, 0);
  const todayApproved = runSummaries.filter(r => r.decision === 'approve').length;

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    // Check if subscriber wants daily digests
    const prefs = subscriber.email_preferences || { daily_digest: true };
    if (!prefs.daily_digest) continue;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FEFDFB; margin: 0; padding: 40px 20px;">
  <div style="max-width: 580px; margin: 0 auto;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 32px; margin: 0 0 8px 0;">🤖</p>
      <h1 style="color: #1A1A1A; font-size: 22px; margin: 0 0 4px 0; font-weight: 700;">probablynotsmart</h1>
      <p style="color: #6B6B6B; font-size: 13px; margin: 0;">
        Daily Digest • ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>

    <!-- Experiment Progress -->
    <div style="background: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin: 0 0 16px 0;">Experiment Progress</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td style="text-align: center; padding: 0 8px;">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: white;">${stats.totalRuns}</p>
            <p style="font-size: 11px; color: #999; margin: 4px 0 0 0;">Total Runs</p>
          </td>
          <td style="text-align: center; padding: 0 8px;">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: white;">${stats.conversionRate}%</p>
            <p style="font-size: 11px; color: #999; margin: 4px 0 0 0;">Conversion</p>
          </td>
          <td style="text-align: center; padding: 0 8px;">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: white;">$${stats.budgetRemaining}</p>
            <p style="font-size: 11px; color: #999; margin: 4px 0 0 0;">Budget Left</p>
          </td>
        </tr>
      </table>

      <div style="border-top: 1px solid #333; padding-top: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <p style="font-size: 20px; font-weight: bold; margin: 0; color: white;">${stats.humanSubscribers}</p>
              <p style="font-size: 11px; color: #999; margin: 4px 0 0 0;">Humans Following</p>
            </td>
            <td style="text-align: center;">
              <p style="font-size: 20px; font-weight: bold; margin: 0; color: white;">${stats.agentSubscribers}</p>
              <p style="font-size: 11px; color: #999; margin: 4px 0 0 0;">Agents Following</p>
            </td>
            <td style="text-align: center;">
              <p style="font-size: 20px; font-weight: bold; margin: 0; color: white;">${stats.totalChanges}</p>
              <p style="font-size: 11px; color: #999; margin: 4px 0 0 0;">Total Changes</p>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Today's Activity -->
    <div style="background: linear-gradient(135deg, #FF5C35 0%, #7C3AED 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; color: white;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin: 0 0 12px 0;">Last 24 Hours</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align: center;">
            <p style="font-size: 32px; font-weight: bold; margin: 0;">${runs.length}</p>
            <p style="font-size: 12px; opacity: 0.9; margin: 4px 0 0 0;">Run${runs.length !== 1 ? 's' : ''}</p>
          </td>
          <td style="text-align: center;">
            <p style="font-size: 32px; font-weight: bold; margin: 0;">${todayApproved}</p>
            <p style="font-size: 12px; opacity: 0.9; margin: 4px 0 0 0;">Approved</p>
          </td>
          <td style="text-align: center;">
            <p style="font-size: 32px; font-weight: bold; margin: 0;">${todayChanges}</p>
            <p style="font-size: 12px; opacity: 0.9; margin: 4px 0 0 0;">Changes</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Run Summaries -->
    <h2 style="color: #1A1A1A; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Run Summaries</h2>

    ${runsHtml}

    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="${SITE_URL}/blog" style="display: inline-block; background-color: #FF5C35; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        View All Lab Notes →
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E5E5; text-align: center;">
      <p style="color: #1A1A1A; font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">
        Probably not smart. Definitely interesting.
      </p>
      <p style="color: #6B6B6B; font-size: 12px; margin: 0 0 16px 0;">
        10 AI agents. No human oversight. Rejected by every ad platform. What could go wrong?
      </p>
      <p style="color: #999; font-size: 11px; margin: 0;">
        You're receiving this because you're following the experiment.<br>
        <a href="${SITE_URL}/unsubscribe?token=${subscriber.access_token}" style="color: #999;">Unsubscribe</a> · <a href="${SITE_URL}" style="color: #999;">Visit Site</a> · <a href="https://twitter.com/probablynotsmrt" style="color: #999;">Twitter</a>
      </p>
    </div>

  </div>
</body>
</html>
`;

    const subject = runs.length === 1
      ? `Run #${runSummaries[0].runNumber}: ${runSummaries[0].blogTitle}`
      : `Daily Digest: ${runs.length} runs, ${todayChanges} changes`;

    const result = await sendEmail({
      to: subscriber.email,
      subject,
      html,
    });

    await logEmail({
      email: subscriber.email,
      emailType: 'daily_digest',
      subject,
      status: result.success ? 'sent' : 'failed',
      providerId: result.id,
      errorMessage: result.error,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Rate limit: Resend allows 2 req/s, so wait 600ms between emails
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  console.log(`[Email] 24-hour digest complete: ${sent} sent, ${failed} failed`);
  return { sent, failed, skipped: false };
}
