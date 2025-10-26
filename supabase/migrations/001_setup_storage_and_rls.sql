-- Migration: Setup Storage and Row Level Security
-- Created: 2025-10-26
-- Description: Adds player photo storage support and implements RLS policies

-- ============================================================================
-- PART 1: STORAGE SETUP
-- ============================================================================

-- Create storage bucket for player photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-photos',
  'player-photos',
  false, -- Private bucket, use signed URLs
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Add photo_storage_path column to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS photo_storage_path TEXT NULL,
ADD COLUMN IF NOT EXISTS photo_updated_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for faster photo lookups
CREATE INDEX IF NOT EXISTS idx_players_photo_storage_path
ON players(photo_storage_path)
WHERE photo_storage_path IS NOT NULL;

-- ============================================================================
-- PART 2: STORAGE RLS POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can upload player photos
CREATE POLICY "Authenticated users can upload player photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-photos'
);

-- Policy: Authenticated users can update their uploaded photos
CREATE POLICY "Authenticated users can update player photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'player-photos');

-- Policy: Authenticated users can delete player photos
CREATE POLICY "Authenticated users can delete player photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'player-photos');

-- Policy: Authenticated users can read player photos
CREATE POLICY "Authenticated users can read player photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'player-photos');

-- ============================================================================
-- PART 3: DATABASE RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_players ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PLAYERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authenticated users can view all players"
ON players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert players"
ON players FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update players"
ON players FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete players"
ON players FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- TEAMS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authenticated users can view all teams"
ON teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert teams"
ON teams FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update teams"
ON teams FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete teams"
ON teams FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authenticated users can view all events"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert events"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON events FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete events"
ON events FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authenticated users can view all attendance"
ON attendance FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance"
ON attendance FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete attendance"
ON attendance FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- GUARDIANS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authenticated users can view all guardians"
ON guardians FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert guardians"
ON guardians FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update guardians"
ON guardians FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete guardians"
ON guardians FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- TERMS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authenticated users can view all terms"
ON terms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert terms"
ON terms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update terms"
ON terms FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete terms"
ON terms FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- JUNCTION TABLES POLICIES
-- ============================================================================

-- Memberships (player-team junction)
CREATE POLICY "Authenticated users can view all memberships"
ON memberships FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert memberships"
ON memberships FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update memberships"
ON memberships FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete memberships"
ON memberships FOR DELETE
TO authenticated
USING (true);

-- Player Terms
CREATE POLICY "Authenticated users can view all player_terms"
ON player_terms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert player_terms"
ON player_terms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update player_terms"
ON player_terms FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete player_terms"
ON player_terms FOR DELETE
TO authenticated
USING (true);

-- Team Terms
CREATE POLICY "Authenticated users can view all team_terms"
ON team_terms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert team_terms"
ON team_terms FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update team_terms"
ON team_terms FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete team_terms"
ON team_terms FOR DELETE
TO authenticated
USING (true);

-- Guardian Players
CREATE POLICY "Authenticated users can view all guardian_players"
ON guardian_players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert guardian_players"
ON guardian_players FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update guardian_players"
ON guardian_players FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete guardian_players"
ON guardian_players FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up old player photos when uploading new ones
CREATE OR REPLACE FUNCTION cleanup_old_player_photo()
RETURNS TRIGGER AS $$
BEGIN
  -- If photo_storage_path changed and old path exists, mark for cleanup
  IF OLD.photo_storage_path IS NOT NULL
     AND NEW.photo_storage_path IS DISTINCT FROM OLD.photo_storage_path THEN
    -- Delete old file from storage
    -- Note: Actual deletion happens in application code with storage API
    NEW.photo_updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track photo updates
DROP TRIGGER IF EXISTS trigger_cleanup_old_player_photo ON players;
CREATE TRIGGER trigger_cleanup_old_player_photo
  BEFORE UPDATE ON players
  FOR EACH ROW
  WHEN (OLD.photo_storage_path IS DISTINCT FROM NEW.photo_storage_path)
  EXECUTE FUNCTION cleanup_old_player_photo();

-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================

COMMENT ON COLUMN players.photo_storage_path IS 'Storage path for player photo in Supabase Storage';
COMMENT ON COLUMN players.photo_updated_at IS 'Timestamp of last photo update';
