-- Migration 008: Social Features
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS activity_likes (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS activity_comments (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created ON follows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON activity_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_created ON activity_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created ON activity_comments(created_at DESC);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_activity_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET like_count = like_count + 1 WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET like_count = like_count - 1 WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_activity_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET comment_count = comment_count + 1 WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET comment_count = comment_count - 1 WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_activity_likes ON activity_likes;
CREATE TRIGGER trigger_update_activity_likes
AFTER INSERT OR DELETE ON activity_likes
FOR EACH ROW EXECUTE FUNCTION update_activity_like_count();

DROP TRIGGER IF EXISTS trigger_update_activity_comments ON activity_comments;
CREATE TRIGGER trigger_update_activity_comments
AFTER INSERT OR DELETE ON activity_comments
FOR EACH ROW EXECUTE FUNCTION update_activity_comment_count();

DROP TRIGGER IF EXISTS trigger_update_user_follows ON follows;
CREATE TRIGGER trigger_update_user_follows
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_user_follow_counts();
