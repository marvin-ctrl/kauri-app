-- Simple Payment System
-- Team fees and player payments

-- Team fees (default amount per team per term)
CREATE TABLE IF NOT EXISTS team_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_term_id UUID NOT NULL REFERENCES team_terms(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_term_id)
);

-- Player payments
CREATE TABLE IF NOT EXISTS player_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_term_id UUID NOT NULL REFERENCES player_terms(id) ON DELETE CASCADE,
  team_term_id UUID NOT NULL REFERENCES team_terms(id) ON DELETE CASCADE,
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid BOOLEAN GENERATED ALWAYS AS (amount_paid >= amount_due) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_term_id, team_term_id)
);

-- Indexes
CREATE INDEX idx_team_fees_team_term ON team_fees(team_term_id);
CREATE INDEX idx_player_payments_player_term ON player_payments(player_term_id);
CREATE INDEX idx_player_payments_team_term ON player_payments(team_term_id);
CREATE INDEX idx_player_payments_paid ON player_payments(paid);

-- RLS Policies
ALTER TABLE team_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view team_fees" ON team_fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can modify team_fees" ON team_fees FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth users can view player_payments" ON player_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can modify player_payments" ON player_payments FOR ALL TO authenticated USING (true);
