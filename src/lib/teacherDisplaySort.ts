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
