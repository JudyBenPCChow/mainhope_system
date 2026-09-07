/** 與計糧名單同一套：英文名排序；無英文名用顯示名，並可標異常。 */

export type TeacherSortable = {
  id: string
  name: string
  englishName?: string | null
}

export function teacherEnglishSortKey(t: TeacherSortable): string {
  const en = t.englishName?.trim()
  return (en || t.name).toLocaleLowerCase("en")
}

export function compareTeachersByEnglishName(a: TeacherSortable, b: TeacherSortable): number {
  return teacherEnglishSortKey(a).localeCompare(teacherEnglishSortKey(b), "en")
}

export function teacherMissingEnglishName(t: TeacherSortable): boolean {
  return !t.englishName?.trim()
}

/**
 * 篩選選項：主標用常用名（與計糧 `full_name` 相同）。
 * 英文名不同時一併寫出，避免只見「Ling Yat Sum」而找不到 Rafael Ling。
 */
export function teacherFilterOptionLabel(t: TeacherSortable): string {
  const name = t.name.trim()
  const en = t.englishName?.trim() ?? ""
  if (!en) return name
  const nameKey = name.toLocaleLowerCase("en")
  const enKey = en.toLocaleLowerCase("en")
  if (enKey === nameKey) return name
  if (nameKey.includes(enKey)) return name
  return `${name}（${en}）`
}
