-- 同名多筆（僅統計，供管理參考）
SELECT full_name, COUNT(*)::int AS cnt
FROM public.students
GROUP BY full_name
HAVING COUNT(*) > 1
ORDER BY cnt DESC, full_name;
