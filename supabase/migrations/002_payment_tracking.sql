-- Migration: Add payment tracking functionality
-- Created: 2025-10-26
-- Description: Adds team fees and player payment tracking

-- Table: team_fees
-- Stores the fee amount for each team per term
CREATE TABLE IF NOT EXISTS team_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, term_id)
);

-- Table: payments
-- Tracks individual player payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_date DATE,
  payment_method VARCHAR(50),
  notes TEXT,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, team_id, term_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_team_fees_team_term ON team_fees(team_id, term_id);
CREATE INDEX idx_payments_player ON payments(player_id);
CREATE INDEX idx_payments_team_term ON payments(team_id, term_id);
CREATE INDEX idx_payments_paid ON payments(paid);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at timestamp
CREATE TRIGGER update_team_fees_updated_at
  BEFORE UPDATE ON team_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE team_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_fees
CREATE POLICY "Allow authenticated users to view team fees"
  ON team_fees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert team fees"
  ON team_fees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update team fees"
  ON team_fees FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete team fees"
  ON team_fees FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for payments
CREATE POLICY "Allow authenticated users to view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);
