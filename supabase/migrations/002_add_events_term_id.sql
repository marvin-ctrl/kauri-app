-- Add direct term linkage for event scoping
ALTER TABLE events
ADD COLUMN IF NOT EXISTS term_id UUID NULL REFERENCES terms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_term_id ON events(term_id);

-- Backfill existing events from team_term relationship where possible.
UPDATE events e
SET term_id = tt.term_id
FROM team_terms tt
WHERE e.team_term_id = tt.id
  AND e.term_id IS NULL;
