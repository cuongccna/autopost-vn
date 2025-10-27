-- Migration: Add media type support to autopostvn_posts table
-- Created: 2025-10-27
-- Purpose: Support image/video type tracking for Facebook posts
-- Note: media_urls column already exists in autopostvn_posts schema

-- Add media_type column to autopostvn_posts table
ALTER TABLE public.autopostvn_posts
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'none';

-- Add check constraint for media_type
ALTER TABLE public.autopostvn_posts
ADD CONSTRAINT media_type_check 
CHECK (media_type IN ('image', 'video', 'album', 'none'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_autopostvn_posts_media_type 
ON public.autopostvn_posts(media_type);

-- Comment the column
COMMENT ON COLUMN public.autopostvn_posts.media_type IS 'Type of media: image, video, album, or none for text-only posts';
