-- 指定帳號角色：
-- admin:
--   carolfanwl@gmail.com
--   526956762@qq.com
--   markyu@mainhope.edu.hk
-- alien:
--   fanhoiying1996@gmail.com
-- teacher:
--   judychuhiuching@gmail.com -> Judy Chu
--   timckcheung@gmail.com -> Tim Cheung
--   shek2471@gmail.com -> Billy Shek
--   lingyatsum@gmail.com -> Rafeal Ling
--   cyndintc@link.cuhk.edu.hk -> Cyndi Ng
--   chunkee111@gmail.com -> Thom Choeng
--   2006kwok.05wai.01lam@gmail.com -> Natalie Kwok

do $$
declare
  v_email text;
  v_teacher_id uuid;
  v_row record;
begin
  -- 管理員
  for v_row in
    select *
    from (
      values
        ('carolfanwl@gmail.com', 'Carol Fan'),
        ('526956762@qq.com', 'Sophie'),
        ('markyu@mainhope.edu.hk', 'Mark Yu')
    ) as t(email, display_name)
  loop
    update public.app_users
       set role = 'admin',
           teacher_id = null,
           display_name = coalesce(v_row.display_name, display_name),
           updated_at = now()
     where lower(email) = lower(v_row.email);

    if not found then
      insert into public.app_users (email, display_name, role, teacher_id)
      values (lower(v_row.email), v_row.display_name, 'admin', null);
    end if;
  end loop;

  -- 外星人（唯一指定）
  v_email := 'fanhoiying1996@gmail.com';
  update public.app_users
     set role = 'alien',
         teacher_id = null,
         display_name = 'Hoi Ying Fan',
         updated_at = now()
   where lower(email) = lower(v_email);

  if not found then
    insert into public.app_users (email, display_name, role, teacher_id)
    values (lower(v_email), 'Hoi Ying Fan', 'alien', null);
  end if;

  -- 老師（需綁定 teacher_id）
  for v_row in
    select *
    from (
      values
        ('judychuhiuching@gmail.com', 'Judy Chu', 'Judy Chu'),
        ('timckcheung@gmail.com', 'Tim Cheung', 'Tim Cheung'),
        ('shek2471@gmail.com', 'Billy Shek', 'Billy Shek'),
        ('lingyatsum@gmail.com', 'Rafeal Ling', 'Rafeal Ling'),
        ('cyndintc@link.cuhk.edu.hk', 'Cyndi Ng', 'Cyndi Ng'),
        ('chunkee111@gmail.com', 'Thom Choeng', 'Thom Cheong'),
        ('2006kwok.05wai.01lam@gmail.com', 'Natalie Kwok', 'Natalie Kwok')
    ) as t(email, display_name, teacher_lookup)
  loop
    select te.id
      into v_teacher_id
      from public.teachers te
     where lower(coalesce(te.full_name, '')) = lower(v_row.teacher_lookup)
        or lower(coalesce(te.english_name, '')) = lower(v_row.teacher_lookup)
        or lower(coalesce(te.email, '')) = lower(v_row.email)
     limit 1;

    if v_teacher_id is null then
      insert into public.teachers (full_name, english_name, email, status)
      values (v_row.teacher_lookup, v_row.teacher_lookup, lower(v_row.email), '在職')
      returning id into v_teacher_id;
    end if;

    update public.app_users
       set role = 'teacher',
           teacher_id = v_teacher_id,
           display_name = coalesce(v_row.display_name, display_name),
           updated_at = now()
     where lower(email) = lower(v_row.email);

    if not found then
      insert into public.app_users (email, display_name, role, teacher_id)
      values (lower(v_row.email), v_row.display_name, 'teacher', v_teacher_id);
    end if;
  end loop;
end $$;
