/*
# NOVAX Exchange — Core Schema

Creates the tables needed to power the full exchange experience advertised
on the landing page: portfolio balances, spot & limit orders, recurring buys,
and per-user security settings.

## New Tables

1. `holdings`
   - One row per (user, asset symbol). Includes `USD` as a synthetic asset so
     the user's cash balance lives in the same table as crypto holdings.
   - `user_id` (uuid, defaults to auth.uid())
   - `symbol` (text, e.g. 'USD', 'BTC', 'ETH', 'SOL')
   - `amount` (numeric, available balance)
   - Unique on (user_id, symbol)

2. `orders`
   - Trade orders: spot (market) and limit, buy or sell.
   - `user_id`, `symbol`, `side` ('buy'/'sell'), `type` ('market'/'limit'),
     `amount` (units of the asset), `price` (limit price, or fill price for
     market orders), `status` ('open'/'filled'/'cancelled'),
     `created_at`, `filled_at`.

3. `recurring_buys`
   - Scheduled automated purchases of a set USD amount.
   - `user_id`, `symbol`, `amount_usd`, `frequency`
     ('daily'/'weekly'/'biweekly'/'monthly'), `active` (bool),
     `created_at`, `last_run`.

4. `security_settings`
   - Per-user security toggles shown on the Security page.
   - `user_id`, `two_factor_enabled` (bool), `login_alerts` (bool),
     `withdrawal_whitelist` (bool), `created_at`.

## Security

- RLS enabled on every table.
- All policies scoped to `TO authenticated` with `auth.uid() = user_id`
  ownership checks — one policy per CRUD verb.
- `user_id` columns default to `auth.uid()` so inserts that omit the owner
  still satisfy the WITH CHECK constraint.
*/

-- holdings
CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, symbol)
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_holdings" ON holdings;
CREATE POLICY "select_own_holdings" ON holdings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_holdings" ON holdings;
CREATE POLICY "insert_own_holdings" ON holdings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_holdings" ON holdings;
CREATE POLICY "update_own_holdings" ON holdings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_holdings" ON holdings;
CREATE POLICY "delete_own_holdings" ON holdings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  type text NOT NULL CHECK (type IN ('market','limit')),
  amount numeric NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','cancelled')),
  created_at timestamptz DEFAULT now(),
  filled_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- recurring_buys
CREATE TABLE IF NOT EXISTS recurring_buys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  amount_usd numeric NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_run timestamptz
);

ALTER TABLE recurring_buys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recurring" ON recurring_buys;
CREATE POLICY "select_own_recurring" ON recurring_buys FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recurring" ON recurring_buys;
CREATE POLICY "insert_own_recurring" ON recurring_buys FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recurring" ON recurring_buys;
CREATE POLICY "update_own_recurring" ON recurring_buys FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recurring" ON recurring_buys;
CREATE POLICY "delete_own_recurring" ON recurring_buys FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- security_settings
CREATE TABLE IF NOT EXISTS security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  login_alerts boolean NOT NULL DEFAULT true,
  withdrawal_whitelist boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_security" ON security_settings;
CREATE POLICY "select_own_security" ON security_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_security" ON security_settings;
CREATE POLICY "insert_own_security" ON security_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_security" ON security_settings;
CREATE POLICY "update_own_security" ON security_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_security" ON security_settings;
CREATE POLICY "delete_own_security" ON security_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
