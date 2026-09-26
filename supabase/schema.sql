create table if not exists public.surprises (
  id uuid primary key,
  created_at timestamptz not null default now(),
  recipient_name text not null check (char_length(recipient_name) between 1 and 120),
  sender_name text not null check (char_length(sender_name) between 1 and 120),
  passcode_length smallint not null check (passcode_length between 4 and 12),
  passcode_hash text not null,
  configuration jsonb not null
);

alter table public.surprises enable row level security;

insert into storage.buckets (id, name, public)
values ('surprise-media', 'surprise-media', false)
on conflict (id) do nothing;

-- No anonymous policies are created. The server uses the service-role key,
-- which bypasses RLS without exposing protected rows to the browser.
