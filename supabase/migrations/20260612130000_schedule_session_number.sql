-- 排程堂次：班別內依日期+時間順序編號，可手動覆寫
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS session_number integer;

-- 依班別、日期、時間回填（含取消課堂）
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY class_id
      ORDER BY scheduled_date ASC, start_time ASC NULLS LAST, created_at ASC
    ) AS rn
  FROM public.schedules
  WHERE class_id IS NOT NULL
)
UPDATE public.schedules s
SET session_number = r.rn
FROM ranked r
WHERE s.id = r.id
  AND s.session_number IS NULL;
