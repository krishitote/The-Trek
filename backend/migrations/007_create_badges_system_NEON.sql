-- Migration 007: Achievement Badges System
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

INSERT INTO badges (name, description, icon, category, criteria) VALUES
  ('First Steps', 'Complete your first activity', '🎯', 'milestones', '{"type": "activity_count", "value": 1}'),
  ('Getting Started', 'Complete 10 activities', '🌟', 'milestones', '{"type": "activity_count", "value": 10}'),
  ('Dedicated', 'Complete 50 activities', '💪', 'milestones', '{"type": "activity_count", "value": 50}'),
  ('Century Club', 'Complete 100 activities', '🏆', 'milestones', '{"type": "activity_count", "value": 100}'),
  ('Legend', 'Complete 500 activities', '👑', 'milestones', '{"type": "activity_count", "value": 500}'),
  
  ('10K Trek', 'Cover 10 kilometers total', '🚶', 'distance', '{"type": "total_distance", "value": 10}'),
  ('Half Century', 'Cover 50 kilometers total', '🚴', 'distance', '{"type": "total_distance", "value": 50}'),
  ('Century Rider', 'Cover 100 kilometers total', '🏃', 'distance', '{"type": "total_distance", "value": 100}'),
  ('Marathon Master', 'Cover 500 kilometers total', '🎖️', 'distance', '{"type": "total_distance", "value": 500}'),
  ('Ultra Trekker', 'Cover 1000 kilometers total', '⭐', 'distance', '{"type": "total_distance", "value": 1000}'),
  
  ('Week Warrior', 'Maintain a 7-day activity streak', '🔥', 'streaks', '{"type": "streak", "value": 7}'),
  ('Consistency King', 'Maintain a 14-day activity streak', '⚡', 'streaks', '{"type": "streak", "value": 14}'),
  ('Unstoppable', 'Maintain a 30-day activity streak', '💥', 'streaks', '{"type": "streak", "value": 30}'),
  ('Iron Will', 'Maintain a 60-day activity streak', '🛡️', 'streaks', '{"type": "streak", "value": 60}'),
  ('Phoenix', 'Maintain a 100-day activity streak', '🔥', 'streaks', '{"type": "streak", "value": 100}'),
  
  ('Speed Demon', 'Achieve pace under 5 min/km', '⚡', 'performance', '{"type": "fastest_pace", "value": 5}'),
  ('Marathon Runner', 'Complete single activity over 42km', '🏃', 'performance', '{"type": "single_distance", "value": 42}'),
  ('Endurance Beast', 'Complete activity lasting 180+ minutes', '💪', 'performance', '{"type": "single_duration", "value": 180}'),
  
  ('Multi-Sport', 'Try all activity types', '🎯', 'variety', '{"type": "activity_types", "value": 5}'),
  ('Explorer', 'Log activities in 3 different activity types', '🌍', 'variety', '{"type": "activity_types", "value": 3}'),
  
  ('Early Bird', 'Complete activity before 6 AM', '🌅', 'special', '{"type": "time_of_day", "value": "morning"}'),
  ('Night Owl', 'Complete activity after 10 PM', '🌙', 'special', '{"type": "time_of_day", "value": "night"}'),
  ('Weekend Warrior', 'Complete 10 weekend activities', '🎉', 'special', '{"type": "weekend_activities", "value": 10}')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_user_badge_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET badge_count = badge_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET badge_count = badge_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_badge_count ON user_badges;
CREATE TRIGGER trigger_update_badge_count
AFTER INSERT OR DELETE ON user_badges
FOR EACH ROW EXECUTE FUNCTION update_user_badge_count();
