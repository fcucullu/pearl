-- Pearl: Period & Cycle Tracker

-- Periods table
create table if not exists pearl_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz default now()
);

alter table pearl_periods enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own periods' and tablename = 'pearl_periods') then
    create policy "Users can manage their own periods" on pearl_periods
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_pearl_periods_user on pearl_periods(user_id);

-- Symptoms table
create table if not exists pearl_symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood text,
  energy text,
  pain_level text,
  pain_location text[],
  bloating boolean default false,
  cravings boolean default false,
  insomnia boolean default false,
  acne boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table pearl_symptoms enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own symptoms' and tablename = 'pearl_symptoms') then
    create policy "Users can manage their own symptoms" on pearl_symptoms
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_pearl_symptoms_user_date on pearl_symptoms(user_id, date);

-- Partner notifications table
create table if not exists pearl_partner_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  partner_email text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

alter table pearl_partner_notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own notifications' and tablename = 'pearl_partner_notifications') then
    create policy "Users can manage their own notifications" on pearl_partner_notifications
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
