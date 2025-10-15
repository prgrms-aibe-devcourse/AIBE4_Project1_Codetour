-- 프로필 테이블 생성 --
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


alter table public.profiles enable row level security;

-- 중복 방지 --
drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;


create policy "read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);



-- 유저 프로필 생성 --
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();



create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();