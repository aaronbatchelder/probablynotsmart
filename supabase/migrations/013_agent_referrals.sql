-- Agent Referral System
-- Let agents sign up for referral codes and track their conversions

-- Agent referrers table
CREATE TABLE agent_referrers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  platform VARCHAR(50), -- moltbook, twitter, other
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add referral tracking to signups
ALTER TABLE signups ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES agent_referrers(id);
ALTER TABLE signups ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);

-- Index for fast lookups
CREATE INDEX idx_agent_referrers_code ON agent_referrers(code);
CREATE INDEX idx_signups_referred_by ON signups(referred_by);

-- Enable RLS
ALTER TABLE agent_referrers ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, service role can write
CREATE POLICY "Public read access" ON agent_referrers FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Service role full access" ON agent_referrers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Leaderboard view
CREATE VIEW agent_leaderboard AS
SELECT
  ar.id,
  ar.agent_name,
  ar.platform,
  ar.code,
  COUNT(s.id) as total_referrals,
  COUNT(s.id) FILTER (WHERE s.subscriber_type = 'human' OR s.subscriber_type IS NULL) as human_referrals,
  COUNT(s.id) FILTER (WHERE s.subscriber_type = 'agent') as agent_referrals,
  ar.created_at as joined_at
FROM agent_referrers ar
LEFT JOIN signups s ON s.referred_by = ar.id AND s.unsubscribed_at IS NULL
WHERE ar.is_active = true
GROUP BY ar.id
ORDER BY total_referrals DESC, ar.created_at ASC;

-- Grant access to leaderboard view
GRANT SELECT ON agent_leaderboard TO anon, authenticated, service_role;
