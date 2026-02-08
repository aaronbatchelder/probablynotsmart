-- ============================================
-- TWITTER FOLLOWS: Track who we've followed
-- ============================================

CREATE TABLE twitter_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT, -- Why we followed (keyword that matched)
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unfollowed_at TIMESTAMPTZ, -- If we later unfollow

    UNIQUE(username)
);

CREATE INDEX idx_twitter_follows_username ON twitter_follows(username);
CREATE INDEX idx_twitter_follows_followed_at ON twitter_follows(followed_at);
