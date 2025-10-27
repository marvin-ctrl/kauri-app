# Payment System Setup Instructions

## ⚠️ IMPORTANT: Run This First

The payment system requires database tables that must be created manually. Follow these steps:

### Step 1: Check if tables exist

Run this in your Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('team_fees', 'player_payments');
```

If you see both tables listed, you're good. If not, continue to Step 2.

### Step 2: Run the migration

Copy and run this entire SQL script in your Supabase SQL Editor:

```sql
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
CREATE INDEX IF NOT EXISTS idx_team_fees_team_term ON team_fees(team_term_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_player_term ON player_payments(player_term_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_team_term ON player_payments(team_term_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_paid ON player_payments(paid);

-- RLS Policies
ALTER TABLE team_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth users can view team_fees" ON team_fees;
DROP POLICY IF EXISTS "Auth users can modify team_fees" ON team_fees;
DROP POLICY IF EXISTS "Auth users can view player_payments" ON player_payments;
DROP POLICY IF EXISTS "Auth users can modify player_payments" ON player_payments;

CREATE POLICY "Auth users can view team_fees" ON team_fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can modify team_fees" ON team_fees FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth users can view player_payments" ON player_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can modify player_payments" ON player_payments FOR ALL TO authenticated USING (true);
```

### Step 3: Verify it worked

Run this query:

```sql
SELECT
  'team_fees' as table_name,
  COUNT(*) as row_count
FROM team_fees
UNION ALL
SELECT
  'player_payments' as table_name,
  COUNT(*) as row_count
FROM player_payments;
```

You should see both tables with 0 rows (unless you already have data).

### Step 4: Test the system

1. Go to `/payments` in your app
2. Select a term from the dropdown
3. Click "Set Fee" for a team and enter an amount (e.g., 150)
4. Click Save
5. You should see player payments appear in the table below

## Common Issues

### "relation does not exist" error
- The tables haven't been created yet
- Run the migration from Step 2

### "permission denied" error
- RLS policies aren't set up correctly
- Re-run the RLS section from Step 2

### Fees save but players don't appear
- Make sure you have:
  - A term selected in the header
  - Players assigned to teams for that term
  - Run `/teams/{id}/assign` to assign players first

### Nothing happens when clicking Save
- Open browser console (F12) and check for errors
- Make sure you're logged in
- Check that the term is selected

## How It Works

1. **Set Team Fee**: Creates a record in `team_fees` for that team/term
2. **Auto-create Player Fees**: Creates records in `player_payments` for each player on that team
3. **Update Payments**: Edit the `amount_paid` for individual players
4. **Status Badge**: Automatically calculates if paid (amount_paid >= amount_due)

## Troubleshooting

If nothing works:

1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify you're authenticated (should see your email in nav bar)
4. Make sure a term is selected (dropdown in header)
5. Verify players are assigned to teams for the current term
