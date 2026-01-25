// ============================================
// probablynotsmart Shared Types
// ============================================

// ============================================
// Run Types
// ============================================

export interface Run {
  id: string;
  run_number: number;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';

  bighead_output: BigheadOutput | null;
  gavin_output: GavinOutput | null;
  gilfoyle_output: GilfoyleOutput | null;
  gavin_gilfoyle_iterations: number;
  aligned_proposal: AlignedProposal | null;
  dinesh_output: DineshOutput | null;
  laurie_decision: LaurieDecision | null;
  monica_output: MonicaOutput | null;
  erlich_output: ErlichOutput | null;
  jared_output: JaredOutput | null;
  executor_output: ExecutorOutput | null;
  richard_output: RichardOutput | null;

  metrics_before: Metrics;
  metrics_after: Metrics | null;
  page_state_before: PageState;
  page_state_after: PageState | null;
  changes_made: Change[];

  spend_this_run: number;
  spend_total_after: number;
  budget_remaining: number;

  error_message: string | null;
}

// ============================================
// Metrics Types
// ============================================

export interface Metrics {
  visitors_24h: number;
  unique_sessions_24h: number;
  signups_24h: number;
  conversion_rate_24h: number;
  visitors_total: number;
  signups_total: number;
  conversion_rate_total: number;
  avg_time_on_page: number;
  scroll_depth_avg: number;
  cta_clicks: number;
  bounce_rate: number;
}

// ============================================
// Page State Types
// ============================================

export interface PageState {
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_color: string;
  hero_image_url: string | null;
  body_copy: string;
  social_proof: string[];
  layout: 'centered' | 'split' | 'minimal';
  color_scheme: ColorScheme;
}

export interface ColorScheme {
  background: string;
  text: string;
  accent: string;
  muted: string;
}

export interface Change {
  element: string;
  from: string;
  to: string;
  hypothesis: string;
}

// ============================================
// Page Config Types (Freeform)
// ============================================

export interface PageConfig {
  id: string;
  version: number;
  updated_by_run: number | null;
  config: PageConfigData;
  css_overrides: string | null;
  custom_sections: CustomSection[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Freeform config - this is the baseline, but Gavin can add ANY keys
export interface PageConfigData {
  meta?: {
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
  hero?: {
    headline?: string;
    subheadline?: string;
    cta_text?: string;
    cta_style?: string;
    layout?: string;
    [key: string]: unknown;
  };
  stats?: {
    visible?: boolean;
    items?: string[];
    [key: string]: unknown;
  };
  how_it_works?: {
    visible?: boolean;
    headline?: string;
    steps?: Array<{ number: string; title: string; description: string }>;
    [key: string]: unknown;
  };
  activity?: {
    visible?: boolean;
    headline?: string;
    [key: string]: unknown;
  };
  budget?: {
    visible?: boolean;
    show_donate?: boolean;
    donate_text?: string;
    [key: string]: unknown;
  };
  final_cta?: {
    visible?: boolean;
    headline?: string;
    subheadline?: string;
    cta_text?: string;
    background?: string;
    [key: string]: unknown;
  };
  footer?: {
    visible?: boolean;
    [key: string]: unknown;
  };
  theme?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
    layout?: string;
    [key: string]: unknown;
  };
  section_order?: string[];
  [key: string]: unknown;  // Gavin can add ANY top-level keys
}

export interface CustomSection {
  id: string;
  name: string;
  position: number | 'before' | 'after';
  reference_section?: string;
  html: string;
  css?: string;
}

// ============================================
// Visual Changelog Types
// ============================================

export interface VisualChangelogEntry {
  id: string;
  run_id: string;
  run_number: number;
  change_summary: string;
  change_details: Record<string, unknown>;
  config_before: PageConfigData | null;
  config_after: PageConfigData | null;
  screenshots_before: ScreenshotSet;
  screenshots_after: ScreenshotSet;
  conversion_before: number | null;
  conversion_after: number | null;
  gavin_reasoning: string | null;
  gilfoyle_critique: string | null;
  laurie_decision: string | null;
  created_at: string;
}

export interface ScreenshotSet {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
}

// ============================================
// Agent Output Types
// ============================================

export interface BigheadOutput {
  observations: string[];
  patterns: string[];
  concerns: string[];
  opportunities: string[];
  confidence: number;
}

export interface GavinOutput {
  proposals: Proposal[];
  reasoning: string;
}

export interface Proposal {
  id: string;
  title: string;                    // Short punchy title
  description: string;              // What we're doing
  changes: FreeformChange[];        // Freeform changes - anything goes
  hypothesis: string;               // Why this will work
  expected_impact: string;          // What we expect to happen
  spend_required: number;           // Budget request
  boldness_score: number;           // 1-10, aim high
  chaos_level: 'safe' | 'spicy' | 'unhinged';  // How crazy is this?
}

// Freeform change - Gavin can propose ANYTHING
export interface FreeformChange {
  type: 'content' | 'style' | 'layout' | 'section' | 'custom';
  target: string;                   // What to change (freeform path or description)
  action: 'modify' | 'add' | 'remove' | 'reorder' | 'replace';
  value?: unknown;                   // New value (if applicable)
  description: string;              // Human-readable description
  css?: string;                     // Raw CSS if needed
  html?: string;                    // Raw HTML if adding new elements
}

export interface GilfoyleOutput {
  critiques: Critique[];
  historical_references: HistoricalReference[];
  recommendation: 'approve' | 'revise' | 'reject';
  reasoning: string;
}

export interface Critique {
  proposal_id: string;
  issues: string[];
  severity: 'minor' | 'major' | 'fatal';
}

export interface HistoricalReference {
  run_number: number;
  what_happened: string;
  relevance: string;
}

export interface AlignedProposal {
  description: string;
  changes: Change[];
  hypothesis: string;
  expected_impact: string;
  spend_required: number;
  iterations_to_align: number;
  compromises_made: string[];
}

export interface DineshOutput {
  mission_alignment_score: number; // 1-10
  concerns: string[];
  recommendation: string;
  advisory_note: string;
}

export interface LaurieDecision {
  approved: boolean;
  decision: 'proceed' | 'modify' | 'reject' | 'hold';
  modifications: string[];
  reasoning: string;
  final_proposal: AlignedProposal | null;
}

export interface MonicaOutput {
  spend_requested: number;
  spend_approved: number;
  budget_remaining_after: number;
  days_of_runway: number;
  recommendation: 'approve' | 'reduce' | 'block';
  reasoning: string;
}

export interface ErlichOutput {
  content_type: 'page' | 'blog' | 'social';
  verdict: 'postable' | 'not_postable';
  issues: string[];
  suggestions: string[];
}

export interface JaredOutput {
  checks_passed: string[];
  checks_failed: string[];
  verdict: 'deployable' | 'not_deployable';
  screenshots_before: ScreenshotSet;
  screenshots_after: ScreenshotSet | null;
  issues: string[];
}

export interface ExecutorOutput {
  changes_deployed: Change[];
  ad_spend_adjusted: boolean;
  git_commit_sha: string;
  deploy_url: string;
  success: boolean;
  errors: string[];
}

export interface RichardOutput {
  blog_post: {
    title: string;
    content: string;
    slug: string;
  };
  social_posts: {
    x: string;
    linkedin: string;
    threads: string;
  };
  email_digest: {
    subject: string;
    content: string;
  };
}

export interface RussOutput {
  opportunities_found: Opportunity[];
  engagements_drafted: Engagement[];
}

export interface Opportunity {
  platform: 'x' | 'linkedin' | 'threads';
  url: string;
  author: string;
  content_preview: string;
  relevance_score: number;
  engagement_type: 'reply' | 'quote_tweet';
}

export interface Engagement {
  opportunity_id: string;
  draft_content: string;
  tone: string;
  gilfoyle_approved: boolean;
  erlich_approved: boolean;
}

// ============================================
// Agent Context Types
// ============================================

export interface AgentContext {
  run: Partial<Run>;
  history: Run[];
  metrics: Metrics;
  pageState: PageState;
  config: Config;
  // Personal memory - this agent's past decisions and outcomes
  personalMemory?: AgentMemoryEntry[];
  // Collective memory - what the group decided together
  collectiveMemory?: CollectiveLogEntry[];
  // Track record - this agent's accuracy stats
  trackRecord?: AgentTrackRecord;
  // Previous outputs from other agents in this run
  previousOutputs?: Record<string, unknown>;
}

export interface AgentResult<T> {
  output: T;
  tokensUsed: number;
  reasoning: string;
  // For memory logging
  decisionSummary?: string;
  confidence?: number;
}

export type Agent<T> = (context: AgentContext) => Promise<AgentResult<T>>;

// ============================================
// Agent Memory Types
// ============================================

export type AgentName = 'bighead' | 'gavin' | 'gilfoyle' | 'dinesh' | 'laurie' | 'monica' | 'erlich' | 'jared' | 'richard' | 'russ';

export interface AgentMemoryEntry {
  id: string;
  agent_name: AgentName;
  run_number: number;
  run_id: string;

  // What they decided
  decision_type: string;
  decision_summary: string;
  decision_details: Record<string, unknown> | null;
  confidence: number | null;

  // What happened after
  outcome: 'implemented' | 'rejected' | 'modified' | 'pending' | null;
  outcome_details: Record<string, unknown> | null;

  // Metrics
  conversion_at_decision: number | null;
  conversion_after: number | null;

  // Was their call correct?
  was_correct: boolean | null;
  correctness_reasoning: string | null;

  // Self-reflection
  lessons_learned: string | null;
  would_decide_differently: boolean | null;

  created_at: string;
  updated_at: string;
}

export interface CollectiveLogEntry {
  id: string;
  run_number: number;
  run_id: string;

  // Summary
  run_summary: string;
  proposal_summary: string | null;
  critique_summary: string | null;
  final_decision: string | null;

  // Agent positions
  agent_positions: Record<AgentName, string>;

  // Changes
  changes_made: Record<string, unknown> | null;
  spend_amount: number | null;

  // Results
  conversion_before: number | null;
  conversion_after: number | null;
  was_successful: boolean | null;

  // Lessons
  what_worked: string | null;
  what_didnt_work: string | null;

  created_at: string;
}

export interface AgentTrackRecord {
  agent_name: AgentName;
  total_decisions: number;
  correct_decisions: number;
  incorrect_decisions: number;
  pending_decisions: number;
  accuracy_pct: number | null;
  avg_confidence_when_right: number | null;
  avg_confidence_when_wrong: number | null;
}

// ============================================
// Config Types
// ============================================

export interface Config {
  budget_total: number;
  budget_spent: number;
  budget_remaining: number;
  budget_daily_cap: number;
  run_counter: number;
  experiment_started_at: string | null;
  experiment_status: 'not_started' | 'running' | 'paused' | 'completed';
  site_url: string;
}

// ============================================
// Analytics Types
// ============================================

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  session_id: string;
  visitor_id: string;
  page_url: string;
  referrer: string;
  user_agent: string;
  ip_country: string;
  ip_city: string;
  created_at: string;
}

export interface Signup {
  id: string;
  email: string;
  source: 'landing' | 'blog' | 'social';
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  synced_to_ghost: boolean;
  created_at: string;
}

// ============================================
// Social Types
// ============================================

export interface SocialPost {
  id: string;
  run_id: string;
  platform: 'x' | 'linkedin' | 'threads';
  post_type: 'run_update' | 'engagement' | 'daily_digest' | 'weekly_deep_dive';
  content: string;
  external_id: string | null;
  external_url: string | null;
  engagement_data: Record<string, number> | null;
  posted_at: string | null;
  created_at: string;
}

export interface GrowthAction {
  id: string;
  action_type: 'reply' | 'quote_tweet' | 'like' | 'follow' | 'dm';
  platform: 'x' | 'linkedin' | 'threads';
  target_url: string;
  target_author: string;
  content: string;
  gilfoyle_check: { approved: boolean; reason: string } | null;
  erlich_check: ErlichOutput | null;
  approved: boolean;
  external_id: string | null;
  created_at: string;
}

// ============================================
// Donation Types
// ============================================

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donor_email: string | null;
  donor_name: string | null;
  stripe_payment_id: string | null;
  message: string | null;
  created_at: string;
}
