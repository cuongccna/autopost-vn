-- Add media lifecycle management columns
ALTER TABLE autopostvn_media 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'uploaded',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_urls JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add media type if not exists
ALTER TABLE autopostvn_media 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';

-- Update existing records
UPDATE autopostvn_media 
SET media_type = CASE 
  WHEN file_type LIKE 'video/%' THEN 'video'
  WHEN file_type LIKE 'image/%' THEN 'image'
  ELSE 'image'
END
WHERE media_type IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_lifecycle 
ON autopostvn_media(status, published_at, archived_at);

CREATE INDEX IF NOT EXISTS idx_media_user_status 
ON autopostvn_media(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_type_status 
ON autopostvn_media(media_type, status);

CREATE INDEX IF NOT EXISTS idx_media_workspace 
ON autopostvn_media(workspace_id, status, created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN autopostvn_media.status IS 'Media lifecycle status: uploaded, processing, published, archived, deleted';
COMMENT ON COLUMN autopostvn_media.platform_urls IS 'JSON object with platform URLs: {"facebook": "url", "tiktok": "url"}';
COMMENT ON COLUMN autopostvn_media.metadata IS 'Additional metadata: duration, dimensions, size, etc';
COMMENT ON COLUMN autopostvn_media.tags IS 'User-defined tags for organization';
COMMENT ON COLUMN autopostvn_media.engagement_score IS 'Combined engagement score from all platforms';

-- Add RLS policies for media access
ALTER TABLE autopostvn_media ENABLE ROW LEVEL SECURITY;

-- Users can only see their own media
CREATE POLICY IF NOT EXISTS "Users can view own media"
ON autopostvn_media FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can insert their own media
CREATE POLICY IF NOT EXISTS "Users can insert own media"
ON autopostvn_media FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own media
CREATE POLICY IF NOT EXISTS "Users can update own media"
ON autopostvn_media FOR UPDATE
USING (auth.uid()::text = user_id);

-- Users can soft delete their own media (set deleted_at)
CREATE POLICY IF NOT EXISTS "Users can delete own media"
ON autopostvn_media FOR DELETE
USING (auth.uid()::text = user_id);
