-- ============================================================
-- STEP 1: Ensure counter columns exist on the posts table
-- ============================================================
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS applause_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emojis_count   BIGINT NOT NULL DEFAULT 0;


-- ============================================================
-- STEP 2: post_applause → applause_count
-- ============================================================
CREATE OR REPLACE FUNCTION sync_applause_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET applause_count = applause_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET applause_count = GREATEST(applause_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_applause_count ON post_applause;
CREATE TRIGGER trg_sync_applause_count
AFTER INSERT OR DELETE ON post_applause
FOR EACH ROW EXECUTE FUNCTION sync_applause_count();


-- ============================================================
-- STEP 3: post_comments → comments_count
-- ============================================================
CREATE OR REPLACE FUNCTION sync_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_comments_count ON post_comments;
CREATE TRIGGER trg_sync_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION sync_comments_count();


-- ============================================================
-- STEP 4: post_emojis → emojis_count
-- ============================================================
CREATE OR REPLACE FUNCTION sync_emojis_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET emojis_count = emojis_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET emojis_count = GREATEST(emojis_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_emojis_count ON post_emojis;
CREATE TRIGGER trg_sync_emojis_count
AFTER INSERT OR DELETE ON post_emojis
FOR EACH ROW EXECUTE FUNCTION sync_emojis_count();


-- ============================================================
-- STEP 5: Backfill existing rows (run once to fix current data)
-- ============================================================
UPDATE posts p SET
  applause_count = (SELECT COUNT(*) FROM post_applause WHERE post_id = p.id),
  comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id),
  emojis_count   = (SELECT COUNT(*) FROM post_emojis   WHERE post_id = p.id);
