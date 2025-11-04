-- Create autopostvn_media table with full lifecycle management
CREATE TABLE IF NOT EXISTS autopostvn_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  workspace_id UUID,
  
  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  
  -- Storage information
  bucket TEXT DEFAULT 'media',
  public_url TEXT NOT NULL,
  
  -- Lifecycle management
  status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'published', 'archived', 'deleted')),
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Engagement & Analytics
  engagement_score INTEGER DEFAULT 0,
  platform_urls JSONB DEFAULT '{}',
  
  -- Metadata & Organization
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_user_status 
ON autopostvn_media(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_lifecycle 
ON autopostvn_media(status, published_at, archived_at);

CREATE INDEX IF NOT EXISTS idx_media_type_status 
ON autopostvn_media(media_type, status);

CREATE INDEX IF NOT EXISTS idx_media_workspace 
ON autopostvn_media(workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_tags 
ON autopostvn_media USING GIN(tags);

-- Add comments for documentation
COMMENT ON TABLE autopostvn_media IS 'Media library with lifecycle management for uploaded images and videos';
COMMENT ON COLUMN autopostvn_media.status IS 'Media lifecycle status: uploaded, processing, published, archived, deleted';
COMMENT ON COLUMN autopostvn_media.platform_urls IS 'JSON object with platform URLs: {"facebook": "url", "tiktok": "url"}';
COMMENT ON COLUMN autopostvn_media.metadata IS 'Additional metadata: duration, dimensions, size, etc';
COMMENT ON COLUMN autopostvn_media.tags IS 'User-defined tags for organization';
COMMENT ON COLUMN autopostvn_media.engagement_score IS 'Combined engagement score from all platforms (0-100)';

-- Enable RLS
ALTER TABLE autopostvn_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own media
CREATE POLICY "Users can view own media"
ON autopostvn_media FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own media"
ON autopostvn_media FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own media"
ON autopostvn_media FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own media"
ON autopostvn_media FOR DELETE
USING (auth.uid()::text = user_id);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_autopostvn_media_updated_at
BEFORE UPDATE ON autopostvn_media
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
