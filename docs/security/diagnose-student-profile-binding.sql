-- READ ONLY. Run separately AFTER reviewing inspect-supabase-read-only.sql.
-- Do not supply an email, password, JWT, or student name.
-- Replace NULL::uuid below with the affected Auth user's UUID locally in the
-- SQL Editor, e.g. '...uuid...'::uuid. Do not share the UUID or edited query.
-- Leave it NULL to return input_required; no student rows are counted then.
-- SQL Editor runs with different privileges from the app. These existence
-- counts DO NOT prove that the student's JWT can SELECT the same row under RLS.
WITH input AS (
  SELECT NULL::uuid AS target_user_id
), summary AS (
  SELECT
    count(*) AS linked_profiles,
    count(*) FILTER (WHERE s.approval_status::text = 'approved') AS approved_profiles,
    count(*) FILTER (WHERE s.approval_status::text = 'approved' AND s.is_active IS TRUE) AS approved_active_profiles,
    count(*) FILTER (WHERE s.approval_status::text = 'pending') AS pending_profiles,
    count(*) FILTER (WHERE s.is_active IS FALSE) AS inactive_profiles,
    count(*) FILTER (WHERE s.approval_status IS NULL OR s.is_active IS NULL) AS incomplete_state_profiles
  FROM public.students s
  JOIN input i ON i.target_user_id IS NOT NULL AND s.user_id = i.target_user_id
)
SELECT
  CASE WHEN i.target_user_id IS NULL THEN 'input_required' ELSE 'ready' END AS diagnostic_status,
  CASE WHEN i.target_user_id IS NULL THEN NULL ELSE EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = i.target_user_id
  ) END AS auth_account_exists,
  summary.*
FROM input i CROSS JOIN summary;

-- Registration/account-linking triggers: definitions only, no row reads.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       t.tgname AS trigger_name,
       pg_catalog.pg_get_triggerdef(t.oid) AS trigger_definition,
       p.proname AS function_name,
       pg_catalog.pg_get_functiondef(p.oid) AS function_definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
WHERE NOT t.tgisinternal AND p.prokind='f'
  AND ((n.nspname='auth' AND c.relname='users')
       OR (n.nspname='public' AND c.relname='students'))
ORDER BY n.nspname,c.relname,t.tgname;
