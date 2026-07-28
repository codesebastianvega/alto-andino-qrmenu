create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.can_manage_agent_brand(target_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.brands
      where brands.id = target_brand_id
        and brands.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and (
          profiles.role = 'superadmin'
          or (
            profiles.brand_id = target_brand_id
            and profiles.role in ('owner', 'admin', 'manager', 'encargado')
          )
        )
    );
$$;

revoke all on function private.can_manage_agent_brand(uuid) from public, anon;
grant execute on function private.can_manage_agent_brand(uuid) to authenticated, service_role;

create or replace function private.agent_location_matches_brand(target_brand_id uuid, target_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_location_id is null or exists (
    select 1
    from public.locations
    where locations.id = target_location_id
      and locations.brand_id = target_brand_id
  );
$$;

revoke all on function private.agent_location_matches_brand(uuid, uuid) from public, anon;
grant execute on function private.agent_location_matches_brand(uuid, uuid) to authenticated, service_role;

create or replace function private.touch_agent_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación',
  status text not null default 'active' check (status in ('active', 'archived')),
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_conversations_location_brand_check
    check (private.agent_location_matches_brand(brand_id, location_id))
);

create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool', 'system')),
  content text,
  tool_name text,
  tool_call_id text,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  created_at timestamptz not null default now(),
  constraint agent_messages_content_check
    check (content is not null or tool_name is not null)
);

create table public.agent_change_sets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.agent_conversations(id) on delete set null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  title text not null,
  summary text,
  status text not null default 'draft' check (
    status in ('draft', 'awaiting_approval', 'approved', 'executing', 'completed', 'partially_failed', 'failed', 'rejected', 'reverted')
  ),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  version integer not null default 1 check (version > 0),
  proposed_actions jsonb not null default '[]'::jsonb check (jsonb_typeof(proposed_actions) = 'array'),
  approval_snapshot jsonb check (approval_snapshot is null or jsonb_typeof(approval_snapshot) = 'object'),
  approved_at timestamptz,
  expires_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_change_sets_location_brand_check
    check (private.agent_location_matches_brand(brand_id, location_id)),
  constraint agent_change_sets_approval_check check (
    (approved_by is null and approved_at is null)
    or (approved_by is not null and approved_at is not null)
  )
);

create table public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  change_set_id uuid not null references public.agent_change_sets(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  sequence integer not null check (sequence > 0),
  tool_name text not null,
  entity_type text not null,
  entity_id uuid,
  operation text not null check (operation in ('create', 'update', 'deactivate', 'restore')),
  status text not null default 'pending' check (status in ('pending', 'executing', 'completed', 'failed', 'reverted', 'skipped')),
  idempotency_key uuid not null default gen_random_uuid(),
  before_data jsonb check (before_data is null or jsonb_typeof(before_data) = 'object'),
  proposed_data jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_data) = 'object'),
  result_data jsonb check (result_data is null or jsonb_typeof(result_data) = 'object'),
  error_message text,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (change_set_id, sequence),
  unique (idempotency_key),
  constraint agent_actions_location_brand_check
    check (private.agent_location_matches_brand(brand_id, location_id))
);

create table public.agent_audit_log (
  id bigint generated always as identity primary key,
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  conversation_id uuid references public.agent_conversations(id) on delete set null,
  change_set_id uuid references public.agent_change_sets(id) on delete set null,
  action_id uuid references public.agent_actions(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in ('proposed', 'submitted', 'approved', 'rejected', 'execution_started', 'action_completed', 'action_failed', 'completed', 'reverted')
  ),
  event_data jsonb not null default '{}'::jsonb check (jsonb_typeof(event_data) = 'object'),
  is_impersonation boolean not null default false,
  created_at timestamptz not null default now(),
  constraint agent_audit_log_location_brand_check
    check (private.agent_location_matches_brand(brand_id, location_id))
);

create index agent_conversations_user_brand_updated_idx
  on public.agent_conversations (user_id, brand_id, updated_at desc);
create index agent_conversations_brand_status_idx
  on public.agent_conversations (brand_id, status, updated_at desc);
create index agent_conversations_location_id_idx on public.agent_conversations (location_id);

create index agent_messages_conversation_created_idx
  on public.agent_messages (conversation_id, created_at);
create index agent_messages_brand_id_idx on public.agent_messages (brand_id);

create index agent_change_sets_brand_status_created_idx
  on public.agent_change_sets (brand_id, status, created_at desc);
create index agent_change_sets_created_by_idx on public.agent_change_sets (created_by);
create index agent_change_sets_approved_by_idx on public.agent_change_sets (approved_by);
create index agent_change_sets_conversation_id_idx on public.agent_change_sets (conversation_id);
create index agent_change_sets_location_id_idx on public.agent_change_sets (location_id);

create index agent_actions_change_set_status_idx
  on public.agent_actions (change_set_id, status, sequence);
create index agent_actions_brand_id_idx on public.agent_actions (brand_id);
create index agent_actions_location_id_idx on public.agent_actions (location_id);

create index agent_audit_log_brand_created_idx
  on public.agent_audit_log (brand_id, created_at desc);
create index agent_audit_log_change_set_id_idx on public.agent_audit_log (change_set_id);
create index agent_audit_log_action_id_idx on public.agent_audit_log (action_id);
create index agent_audit_log_actor_id_idx on public.agent_audit_log (actor_id);
create index agent_audit_log_conversation_id_idx on public.agent_audit_log (conversation_id);
create index agent_audit_log_location_id_idx on public.agent_audit_log (location_id);

create trigger agent_conversations_touch_updated_at
before update on public.agent_conversations
for each row execute function private.touch_agent_updated_at();

create trigger agent_change_sets_touch_updated_at
before update on public.agent_change_sets
for each row execute function private.touch_agent_updated_at();

create trigger agent_actions_touch_updated_at
before update on public.agent_actions
for each row execute function private.touch_agent_updated_at();

alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_change_sets enable row level security;
alter table public.agent_actions enable row level security;
alter table public.agent_audit_log enable row level security;

create policy agent_conversations_select_own
on public.agent_conversations for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_manage_agent_brand(brand_id))
);

create policy agent_conversations_insert_own
on public.agent_conversations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.can_manage_agent_brand(brand_id))
  and (select private.agent_location_matches_brand(brand_id, location_id))
);

create policy agent_conversations_update_own
on public.agent_conversations for update to authenticated
using (
  user_id = (select auth.uid())
  and (select private.can_manage_agent_brand(brand_id))
)
with check (
  user_id = (select auth.uid())
  and (select private.can_manage_agent_brand(brand_id))
  and (select private.agent_location_matches_brand(brand_id, location_id))
);

create policy agent_messages_select_own_conversation
on public.agent_messages for select to authenticated
using (
  (select private.can_manage_agent_brand(brand_id))
  and exists (
    select 1 from public.agent_conversations
    where agent_conversations.id = agent_messages.conversation_id
      and agent_conversations.user_id = (select auth.uid())
      and agent_conversations.brand_id = agent_messages.brand_id
  )
);

create policy agent_messages_insert_user_message
on public.agent_messages for insert to authenticated
with check (
  role = 'user'
  and (select private.can_manage_agent_brand(brand_id))
  and exists (
    select 1 from public.agent_conversations
    where agent_conversations.id = agent_messages.conversation_id
      and agent_conversations.user_id = (select auth.uid())
      and agent_conversations.brand_id = agent_messages.brand_id
  )
);

create policy agent_change_sets_select_brand
on public.agent_change_sets for select to authenticated
using ((select private.can_manage_agent_brand(brand_id)));

create policy agent_actions_select_brand
on public.agent_actions for select to authenticated
using ((select private.can_manage_agent_brand(brand_id)));

create policy agent_audit_log_select_brand
on public.agent_audit_log for select to authenticated
using ((select private.can_manage_agent_brand(brand_id)));

revoke all on public.agent_conversations, public.agent_messages, public.agent_change_sets, public.agent_actions, public.agent_audit_log from anon;
revoke all on public.agent_conversations, public.agent_messages, public.agent_change_sets, public.agent_actions, public.agent_audit_log from authenticated;

grant select, insert, update on public.agent_conversations to authenticated;
grant select, insert on public.agent_messages to authenticated;
grant select on public.agent_change_sets, public.agent_actions, public.agent_audit_log to authenticated;
grant all on public.agent_conversations, public.agent_messages, public.agent_change_sets, public.agent_actions, public.agent_audit_log to service_role;
grant usage, select on sequence public.agent_audit_log_id_seq to service_role;
