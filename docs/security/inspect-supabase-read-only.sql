-- One catalog-only SELECT. No student rows, auth records or secret keys.
-- Review function definitions locally before sharing any output.
WITH tables AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name,
         c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
    AND (c.relname IN ('students','grades','classrooms','learning_content','quizzes','challenges','challenge_submissions')
         OR c.relname LIKE 'quiz_%')
), functions AS (
  SELECT p.oid, n.nspname AS schema_name, p.proname AS function_name,
         pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
         pg_catalog.pg_get_function_result(p.oid) AS result_type,
         p.prosecdef AS security_definer, p.proconfig AS runtime_settings,
         pg_catalog.pg_get_functiondef(p.oid) AS definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND p.proname IN ('is_admin','get_my_student_profile','register_student',
      'get_admin_quiz_results','get_quiz_for_student','get_student_directory',
      'get_my_available_quizzes','submit_my_quiz','submit_quiz_attempt')
)
SELECT jsonb_build_object(
  'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'schema', t.schema_name, 'name', t.table_name, 'rls_enabled', t.rls_enabled,
    'force_rls', t.force_rls,
    'columns', (SELECT jsonb_agg(jsonb_build_object(
      'name', a.attname, 'type', pg_catalog.format_type(a.atttypid,a.atttypmod),
      'nullable', NOT a.attnotnull) ORDER BY a.attnum)
      FROM pg_catalog.pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped),
    'policies', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'name', p.policyname, 'command', p.cmd, 'roles', p.roles,
      'permissive', p.permissive, 'using', p.qual, 'check', p.with_check))
      FROM pg_catalog.pg_policies p
      WHERE p.schemaname=t.schema_name AND p.tablename=t.table_name),'[]'::jsonb)
  ) ORDER BY t.table_name) FROM tables t),'[]'::jsonb),
  'functions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'schema', f.schema_name, 'name', f.function_name, 'arguments', f.arguments,
    'result_type', f.result_type, 'security_definer', f.security_definer,
    'runtime_settings', f.runtime_settings, 'definition', f.definition,
    'execute_permissions', (SELECT jsonb_agg(jsonb_build_object('role', r.rolname,
      'can_execute', pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE')) ORDER BY r.rolname)
      FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated'))
  ) ORDER BY f.function_name,f.arguments) FROM functions f),'[]'::jsonb)
) AS security_metadata;
