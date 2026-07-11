-- 區分小組課程班別與一對一／單對單班別
alter table public.classes
  add column if not exists class_kind text not null default 'group'
    check (class_kind in ('group', 'private'));

comment on column public.classes.class_kind is
  '班別類型：group=小組課程（固定時間收生）；private=一對一／單對單（彈性約課）';

-- 依既有班名回填一對一／單對單
update public.classes
set class_kind = 'private'
where subject ~ '一對一|單對單';
