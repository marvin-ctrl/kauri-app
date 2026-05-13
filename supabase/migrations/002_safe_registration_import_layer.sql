-- Migration: Safe registration import layer
-- Created: 2026-05-13
-- Description: Adds conservative CSV staging, import provenance, and payment review tables.
-- This migration does not import data, send messages, create automations, or confirm payments.

-- ============================================================================
-- IMPORT BATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL DEFAULT 'kauri_master_ops_sheet',
  source_path TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'staging' CHECK (status IN ('staging', 'validating', 'ready', 'promoting', 'promoted', 'rolled_back', 'cancelled')),
  dry_run BOOLEAN NOT NULL DEFAULT true,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  ready_count INTEGER NOT NULL DEFAULT 0 CHECK (ready_count >= 0),
  quarantined_count INTEGER NOT NULL DEFAULT 0 CHECK (quarantined_count >= 0),
  promoted_count INTEGER NOT NULL DEFAULT 0 CHECK (promoted_count >= 0),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL REFERENCES auth.users(id),
  promoted_at TIMESTAMPTZ NULL,
  rolled_back_at TIMESTAMPTZ NULL
);

COMMENT ON TABLE import_batches IS 'Manual CSV import batches for Kauri Master Ops Sheet staging packs. No data is promoted blindly.';
COMMENT ON COLUMN import_batches.source_path IS 'Source folder or CSV pack path, for example kauri-ops/sheets/staging-imports/2026-05-13-new-registrations/.';
COMMENT ON COLUMN import_batches.dry_run IS 'True until Marvin approves promotion into live app tables.';

-- ============================================================================
-- LIVE TABLE PROVENANCE / REVIEW COLUMNS
-- ============================================================================

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_player_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS school_year TEXT NULL,
  ADD COLUMN IF NOT EXISTS photo_video_consent TEXT NULL,
  ADD COLUMN IF NOT EXISTS medical_support_review_note TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_guardian_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE guardian_players
  ADD COLUMN IF NOT EXISTS relationship TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE player_terms
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_enrolment_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE team_terms
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_programme_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL;

COMMENT ON COLUMN players.photo_video_consent IS 'Imported parent consent status. Preserve To confirm for manual review.';
COMMENT ON COLUMN players.medical_support_review_note IS 'Use placeholder text only for first import, e.g. Medical/support note present - review source.';
COMMENT ON COLUMN players.import_batch_id IS 'Import batch that created this player, used for audit and rollback.';
COMMENT ON COLUMN guardians.import_batch_id IS 'Import batch that created this caregiver, used for audit and rollback.';
COMMENT ON COLUMN player_terms.source_enrolment_id IS 'Source enrolment ID such as KF-E-0001 from the Master Ops Sheet.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_players_source_player
  ON players(source_system, source_player_id)
  WHERE source_system IS NOT NULL AND source_player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_duplicate_review
  ON players(LOWER(first_name), LOWER(last_name), school_year);

CREATE INDEX IF NOT EXISTS idx_guardians_email_review
  ON guardians(LOWER(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guardians_phone_review
  ON guardians(phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_guardians_source_key
  ON guardians(source_system, source_guardian_key)
  WHERE source_system IS NOT NULL AND source_guardian_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_player_terms_source_enrolment
  ON player_terms(source_system, source_enrolment_id)
  WHERE source_system IS NOT NULL AND source_enrolment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_live_import_batch_players ON players(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_live_import_batch_guardians ON guardians(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_live_import_batch_guardian_players ON guardian_players(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_live_import_batch_player_terms ON player_terms(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_live_import_batch_team_terms ON team_terms(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_live_import_batch_memberships ON memberships(import_batch_id);

-- ============================================================================
-- REGISTRATION STAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS staging_registration_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  source_row_number INTEGER NULL CHECK (source_row_number IS NULL OR source_row_number > 0),
  source_player_id TEXT NULL,
  source_enrolment_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  player_first_name TEXT NULL,
  player_last_name TEXT NULL,
  player_preferred_name TEXT NULL,
  player_dob DATE NULL,
  player_school_year TEXT NULL,
  player_status TEXT NULL,
  photo_video_consent TEXT NULL,
  medical_support_note_present BOOLEAN NOT NULL DEFAULT false,
  medical_support_review_note TEXT NULL,

  guardian_name TEXT NULL,
  guardian_email TEXT NULL,
  guardian_phone TEXT NULL,
  guardian_relationship TEXT NULL,
  guardian_is_primary BOOLEAN NOT NULL DEFAULT true,

  term_year INTEGER NULL,
  term_number INTEGER NULL CHECK (term_number IS NULL OR term_number BETWEEN 1 AND 4),
  programme_group_name TEXT NULL,
  enrolment_status TEXT NULL,
  registered_at DATE NULL,

  normalized_player_name TEXT NULL,
  normalized_guardian_email TEXT NULL,
  normalized_guardian_phone TEXT NULL,
  duplicate_match_summary TEXT NULL,
  validation_errors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  review_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'quarantined', 'excluded', 'promoted')),
  review_notes TEXT NULL,

  matched_player_id UUID NULL REFERENCES players(id) ON DELETE SET NULL,
  matched_guardian_id UUID NULL REFERENCES guardians(id) ON DELETE SET NULL,
  matched_term_id UUID NULL REFERENCES terms(id) ON DELETE SET NULL,
  matched_team_id UUID NULL REFERENCES teams(id) ON DELETE SET NULL,
  matched_team_term_id UUID NULL REFERENCES team_terms(id) ON DELETE SET NULL,

  promoted_player_id UUID NULL REFERENCES players(id) ON DELETE SET NULL,
  promoted_guardian_id UUID NULL REFERENCES guardians(id) ON DELETE SET NULL,
  promoted_player_term_id UUID NULL REFERENCES player_terms(id) ON DELETE SET NULL,
  promoted_team_term_id UUID NULL REFERENCES team_terms(id) ON DELETE SET NULL,
  promoted_at TIMESTAMPTZ NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE staging_registration_rows IS 'CSV staging rows for registration imports. Rows must be validated and reviewed before promotion.';
COMMENT ON COLUMN staging_registration_rows.raw_payload IS 'Original source row as JSON for audit; access must remain operator-only.';
COMMENT ON COLUMN staging_registration_rows.medical_support_review_note IS 'Placeholder only; do not store detailed medical/support free text here during first import.';
COMMENT ON COLUMN staging_registration_rows.status IS 'pending/ready/quarantined/excluded/promoted review state; imports must not bypass this.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_staging_registration_source_row
  ON staging_registration_rows(import_batch_id, source_row_number)
  WHERE source_row_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staging_registration_batch_status
  ON staging_registration_rows(import_batch_id, status);

CREATE INDEX IF NOT EXISTS idx_staging_registration_duplicate_review
  ON staging_registration_rows(normalized_player_name, normalized_guardian_email, normalized_guardian_phone, player_school_year);

CREATE INDEX IF NOT EXISTS idx_staging_registration_source_ids
  ON staging_registration_rows(source_player_id, source_enrolment_id);

-- ============================================================================
-- PAYMENT REVIEW ONLY
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_review_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  source_payment_id TEXT NULL,
  source_row_number INTEGER NULL CHECK (source_row_number IS NULL OR source_row_number > 0),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  source_player_id TEXT NULL,
  source_enrolment_id TEXT NULL,
  payer_name TEXT NULL,
  payer_email TEXT NULL,
  payer_phone TEXT NULL,
  amount NUMERIC(10, 2) NULL CHECK (amount IS NULL OR amount >= 0),
  payment_date DATE NULL,
  payment_method TEXT NULL,
  payment_reference TEXT NULL,
  source_payment_status TEXT NULL,
  programme_group_name TEXT NULL,

  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (review_status IN ('needs_review', 'matched', 'excluded')),
  review_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  review_notes TEXT NULL,
  matched_player_id UUID NULL REFERENCES players(id) ON DELETE SET NULL,
  matched_player_term_id UUID NULL REFERENCES player_terms(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payment_review_rows IS 'Review-only payment import rows. This is not a confirmed payments ledger.';
COMMENT ON COLUMN payment_review_rows.review_status IS 'Keep as needs_review until Marvin manually clears the row. Do not use as paid status.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_review_source_payment
  ON payment_review_rows(import_batch_id, source_payment_id)
  WHERE source_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_review_batch_status
  ON payment_review_rows(import_batch_id, review_status);

CREATE INDEX IF NOT EXISTS idx_payment_review_duplicate_review
  ON payment_review_rows(payer_email, payer_phone, amount, payment_reference, payment_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_registration_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_review_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view import batches"
ON import_batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert import batches"
ON import_batches FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update import batches"
ON import_batches FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete import batches"
ON import_batches FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view staging registration rows"
ON staging_registration_rows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert staging registration rows"
ON staging_registration_rows FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update staging registration rows"
ON staging_registration_rows FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete staging registration rows"
ON staging_registration_rows FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view payment review rows"
ON payment_review_rows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payment review rows"
ON payment_review_rows FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment review rows"
ON payment_review_rows FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payment review rows"
ON payment_review_rows FOR DELETE
TO authenticated
USING (true);
