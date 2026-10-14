-- One READ-ONLY catalog SELECT. No calls to student RPCs, no student rows,
-- emails, user UUIDs, credentials or JWTs. Review definitions locally before
-- sharing: an old custom function could contain hardcoded sensitive text.
SELECT p.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_catalog.pg_get_function_arguments(p.oid) AS arguments_with_defaults,
       pg_catalog.pg_get_function_result(p.oid) AS result_type,
       p.proargnames AS argument_and_output_names,
       p.proargmodes AS argument_modes,
       p.prosecdef AS security_definer,
       p.proconfig AS runtime_settings,
       pg_catalog.pg_get_functiondef(p.oid) AS definition,
       (SELECT jsonb_agg(jsonb_build_object('role',r.rolname,
         'can_execute',pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE')) ORDER BY r.rolname)
        FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated')) AS execute_permissions
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind='f'
  AND (p.proname IN ('get_my_student_profile','register_student','is_admin',
                    'get_quiz_for_student','get_my_available_quizzes','submit_my_quiz','submit_quiz_attempt')
       OR p.proname ~ '(approve|approval)')
ORDER BY p.proname,identity_arguments;
