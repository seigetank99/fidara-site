create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'client',
  created_at timestamp with time zone default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text,
  created_at timestamp with time zone default now()
);

create table client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(client_id, user_id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  uploaded_by uuid references profiles(id),
  original_file_name text not null,
  storage_key text not null,
  file_type text,
  file_size bigint,
  category text,
  status text not null default 'received',
  notes text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_users enable row level security;
alter table documents enable row level security;

create policy "users can view own profile"
on profiles
for select
to authenticated
using (auth.uid() = id);

create policy "users can view linked clients"
on clients
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = clients.id
      and client_users.user_id = auth.uid()
  )
);

create policy "users can view own client links"
on client_users
for select
to authenticated
using (user_id = auth.uid());

create policy "users can view documents linked through client_users"
on documents
for select
to authenticated
using (
  exists (
    select 1
    from client_users
    where client_users.client_id = documents.client_id
      and client_users.user_id = auth.uid()
  )
);

create policy "users can insert documents linked through client_users"
on documents
for insert
to authenticated
with check (
  exists (
    select 1
    from client_users
    where client_users.client_id = documents.client_id
      and client_users.user_id = auth.uid()
  )
);
