-- ============================================================
-- Stripe Integration Schema
-- ============================================================

-- 1. CUSTOMERS: maps auth.users to Stripe customer IDs
create table if not exists public.customers (
  id uuid references auth.users(id) on delete cascade not null primary key,
  stripe_customer_id text unique
);
alter table public.customers enable row level security;
do $$ begin
  create policy "Can only view own customer data." on public.customers
    for select using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- 2. PRODUCTS: synced from Stripe
create table if not exists public.products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);
alter table public.products enable row level security;
do $$ begin
  create policy "Allow public read-only access to products." on public.products
    for select using (true);
exception when duplicate_object then null;
end $$;

-- 3. PRICES: synced from Stripe (linked to products)
do $$ begin
  create type pricing_type as enum ('one_time', 'recurring');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
exception when duplicate_object then null;
end $$;

create table if not exists public.prices (
  id text primary key,
  product_id text references public.products(id),
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);
alter table public.prices enable row level security;
do $$ begin
  create policy "Allow public read-only access to prices." on public.prices
    for select using (true);
exception when duplicate_object then null;
end $$;

-- 4. SUBSCRIPTIONS: tracks user subscription state
do $$ begin
  create type subscription_status as enum (
    'trialing', 'active', 'canceled', 'incomplete',
    'incomplete_expired', 'past_due', 'unpaid', 'paused'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status subscription_status,
  metadata jsonb,
  price_id text references public.prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);
alter table public.subscriptions enable row level security;
do $$ begin
  create policy "Can only view own subscription data." on public.subscriptions
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- ============================================================
-- Helper function: check if a user has an active subscription
-- ============================================================
create or replace function public.get_user_subscription_status(user_uuid uuid)
returns text
language sql
security definer
as $$
  select status::text
  from public.subscriptions
  where user_id = user_uuid
    and status in ('active', 'trialing')
  order by current_period_end desc
  limit 1;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_user_subscription_status(uuid) to authenticated;
