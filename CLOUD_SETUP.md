# Shared song library setup (PWA Stage 2)

This release is **cloud-ready**, not already connected. The song display, typography, and simultaneous-part layout come from PWA v15. Until configured, it behaves as a local PWA; it does **not** synchronize devices.

## Set up Supabase

1. Create a Supabase project at https://supabase.com. In Authentication, create your administrator user (email/password); disable public signups if only you should administer the library.
2. Open SQL Editor and run the following SQL. Replace `ADMIN_USER_UUID` with the administrator's UUID from Authentication > Users. Do not put passwords in the project files.

```sql
create table if not exists public.song_library (
  id text primary key,
  songs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.song_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.song_library enable row level security;
alter table public.song_admins enable row level security;
create policy "Admins can see own membership" on public.song_admins
  for select to authenticated using (user_id = auth.uid());

create policy "Anyone can read song library" on public.song_library
  for select to anon, authenticated using (true);
create policy "Approved admins can update songs" on public.song_library
  for update to authenticated
  using (exists (select 1 from public.song_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.song_admins where user_id = auth.uid()));

insert into public.song_library(id,songs) values ('main','[]'::jsonb)
on conflict (id) do nothing;
insert into public.song_admins(user_id) values ('ADMIN_USER_UUID'::uuid)
on conflict (user_id) do nothing;
```

3. In `cloud-config.js`, fill in the project URL and **public anon/publishable key** from Supabase project settings. Never use the secret/service_role key in the browser.
4. Upload the PWA files to a static HTTPS host. Keep all files in the same folder, including `cloud-config.js`. Avoid opening `index.html` as a local file: service workers need HTTPS or localhost.
5. Before connecting the cloud, open the original v15 PWA and use Menu > Export Backup to save your current song collection (including any locally edited songs). In the new cloud-enabled PWA, sign in through Menu > Administrator sign-in, then use Import Backup to upload that collection to the shared database. This is a deliberate one-time migration; until you do it, the new cloud table is empty.
6. On a second device, open the same hosted PWA URL. The song list should appear. When an admin saves changes, readers get them the next time the app is opened, regains internet, or when they choose Menu > Refresh shared songs.

## Notes

- Only approved administrators can update the cloud database. The restriction is enforced by database row-level security, not just hidden buttons.
- The most recent cloud library is cached on each device for offline reading. Changes require internet access and administrator sign-in; offline edits are not queued.
- This initial version uses one shared catalog record, so **do not edit simultaneously on multiple administrator devices**; the last successful save wins.
- Backup export remains available. Keep occasional backup copies of the shared library.
- The supplied default songs are still bundled for initial offline fallback, but once cloud is configured, the cloud catalog is authoritative.
- Authentication uses the Supabase password endpoint; the browser keeps its access token in session storage, not in the downloaded PWA files.
