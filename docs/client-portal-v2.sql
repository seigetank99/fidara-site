create table if not exists billing_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  description text,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'open',
  due_date date,
  stripe_hosted_invoice_url text,
  invoice_pdf_url text,
  created_at timestamp with time zone default now()
);

create table if not exists document_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  due_date date,
  created_at timestamp with time zone default now()
);

create table if not exists portal_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  body text not null,
  created_by text default 'Fidara Group',
  created_at timestamp with time zone default now()
);

create index if not exists billing_items_client_id_idx on billing_items (client_id, created_at desc);
create index if not exists document_requests_client_id_idx on document_requests (client_id, created_at desc);
create index if not exists portal_messages_client_id_idx on portal_messages (client_id, created_at desc);

alter table billing_items enable row level security;
alter table document_requests enable row level security;
alter table portal_messages enable row level security;

drop policy if exists "users can view billing items linked through client_users" on billing_items;
create policy "users can view billing items linked through client_users"
on billing_items
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = billing_items.client_id
      and client_users.user_id = auth.uid()
  )
);

drop policy if exists "users can view document requests linked through client_users" on document_requests;
create policy "users can view document requests linked through client_users"
on document_requests
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = document_requests.client_id
      and client_users.user_id = auth.uid()
  )
);

drop policy if exists "users can view portal messages linked through client_users" on portal_messages;
create policy "users can view portal messages linked through client_users"
on portal_messages
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = portal_messages.client_id
      and client_users.user_id = auth.uid()
  )
);
