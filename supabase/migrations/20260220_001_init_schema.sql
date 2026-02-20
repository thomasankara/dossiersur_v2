-- DossierSûr v2 — Initial schema
-- Base partagée "perso-tracker" : toutes les tables préfixées "ds_"
-- Ne JAMAIS toucher aux tables sans préfixe "ds_"

-- =============================================================================
-- TABLES
-- =============================================================================

-- Profils utilisateurs (extension de auth.users)
create table ds_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  plan text not null default 'free',
  credits_remaining int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dossiers de candidature
create table ds_dossiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references ds_profiles(id) on delete cascade not null,
  name text,
  status text not null default 'en_cours',
  overall_score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Candidats dans un dossier
create table ds_candidats (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references ds_dossiers(id) on delete cascade not null,
  role text not null default 'locataire',
  nom text,
  prenom text,
  date_naissance text,
  created_at timestamptz not null default now()
);

-- Documents analysés
create table ds_documents (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid references ds_candidats(id) on delete cascade not null,
  dossier_id uuid references ds_dossiers(id) on delete cascade not null,
  filename text not null,
  file_hash text not null,
  doc_type text not null,
  classified_type text,
  confidence_score int,
  overall_status text,
  person jsonb,
  validation_result jsonb,
  analysis_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Cross-validations par candidat
create table ds_cross_validations (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid references ds_candidats(id) on delete cascade not null unique,
  dossier_id uuid references ds_dossiers(id) on delete cascade not null,
  checks jsonb not null,
  overall_status text not null,
  confidence_score int not null,
  completeness jsonb,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Événements de facturation
create table ds_billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references ds_profiles(id) on delete cascade not null,
  type text not null,
  stripe_event_id text,
  plan text,
  credits_added int default 0,
  amount_cents int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index ds_idx_dossiers_user on ds_dossiers(user_id);
create index ds_idx_candidats_dossier on ds_candidats(dossier_id);
create index ds_idx_documents_candidat on ds_documents(candidat_id);
create index ds_idx_documents_dossier on ds_documents(dossier_id);
create index ds_idx_documents_hash on ds_documents(file_hash);
create index ds_idx_billing_user on ds_billing_events(user_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- ds_profiles
alter table ds_profiles enable row level security;

create policy "ds_profiles_select_own"
  on ds_profiles for select
  using (auth.uid() = id);

create policy "ds_profiles_update_own"
  on ds_profiles for update
  using (auth.uid() = id);

-- ds_dossiers
alter table ds_dossiers enable row level security;

create policy "ds_dossiers_select_own"
  on ds_dossiers for select
  using (auth.uid() = user_id);

create policy "ds_dossiers_insert_own"
  on ds_dossiers for insert
  with check (auth.uid() = user_id);

create policy "ds_dossiers_update_own"
  on ds_dossiers for update
  using (auth.uid() = user_id);

create policy "ds_dossiers_delete_own"
  on ds_dossiers for delete
  using (auth.uid() = user_id);

-- ds_candidats
alter table ds_candidats enable row level security;

create policy "ds_candidats_select_own"
  on ds_candidats for select
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_candidats_insert_own"
  on ds_candidats for insert
  with check (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_candidats_update_own"
  on ds_candidats for update
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_candidats_delete_own"
  on ds_candidats for delete
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

-- ds_documents
alter table ds_documents enable row level security;

create policy "ds_documents_select_own"
  on ds_documents for select
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_documents_insert_own"
  on ds_documents for insert
  with check (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_documents_update_own"
  on ds_documents for update
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_documents_delete_own"
  on ds_documents for delete
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

-- ds_cross_validations
alter table ds_cross_validations enable row level security;

create policy "ds_cross_validations_select_own"
  on ds_cross_validations for select
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_cross_validations_insert_own"
  on ds_cross_validations for insert
  with check (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_cross_validations_update_own"
  on ds_cross_validations for update
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

create policy "ds_cross_validations_delete_own"
  on ds_cross_validations for delete
  using (dossier_id in (select id from ds_dossiers where user_id = auth.uid()));

-- ds_billing_events
alter table ds_billing_events enable row level security;

create policy "ds_billing_events_select_own"
  on ds_billing_events for select
  using (auth.uid() = user_id);

-- insert via service_role uniquement (webhooks)

-- =============================================================================
-- TRIGGER : auto-create profile on signup
-- =============================================================================

create or replace function ds_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.ds_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger ds_on_auth_user_created
  after insert on auth.users
  for each row execute function ds_handle_new_user();

-- =============================================================================
-- TRIGGER : auto-update updated_at
-- =============================================================================

create or replace function ds_handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ds_profiles_updated_at
  before update on ds_profiles
  for each row execute function ds_handle_updated_at();

create trigger ds_dossiers_updated_at
  before update on ds_dossiers
  for each row execute function ds_handle_updated_at();

create trigger ds_cross_validations_updated_at
  before update on ds_cross_validations
  for each row execute function ds_handle_updated_at();
