-- 將 Mark Yu 由 admin 改為 teacher，並綁定 teacher_id
do $$
declare
  v_email text := 'markyu@mainhope.edu.hk';
  v_teacher_id uuid;
begin
  select t.id
    into v_teacher_id
    from public.teachers t
   where lower(coalesce(t.full_name, '')) = lower('Mark Yu')
      or lower(coalesce(t.english_name, '')) = lower('Mark Yu')
      or lower(coalesce(t.email, '')) = lower(v_email)
   limit 1;

  if v_teacher_id is null then
    insert into public.teachers (full_name, english_name, email, status)
    values ('Mark Yu', 'Mark Yu', lower(v_email), '在職')
    returning id into v_teacher_id;
  end if;

  update public.app_users
     set role = 'teacher',
         teacher_id = v_teacher_id,
         display_name = coalesce(display_name, 'Mark Yu'),
         updated_at = now()
   where lower(email) = lower(v_email);

  if not found then
    insert into public.app_users (email, display_name, role, teacher_id)
    values (lower(v_email), 'Mark Yu', 'teacher', v_teacher_id);
  end if;
end $$;
