import { useEffect, useMemo, useState, type ReactNode } from "react"

import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import {
 mergeRecentStudentIds,
 readRecentStudentIds,
 RECENT_STUDENT_ID_LIMIT,
 touchRecentStudentId,
 writeRecentStudentIds,
} from "@/lib/recentStudentIds"
import { formatStudentGrade } from "@/lib/studentGrade"
import { studentDisplayText, studentSearchText } from "@/lib/studentSearchableText"

export type StudentSearchableOption = {
 id: string
 full_name: string
 student_code?: string | null
 english_name?: string | null
 student_phone?: string | null
 parent_phone?: string | null
 grade?: string | null
 registration_status?: string | null
}

type Props = {
 students: readonly StudentSearchableOption[]
 value: string
 onChange: (studentId: string) => void
 /** 最近已收款學生（由呼叫端查庫）；與本機最近選過合併後作為空白清單 */
 recentPaidStudentIds?: readonly string[]
 /** 本機記住最近選過的 localStorage key；不傳則不記住 */
 rememberKey?: string
 disabled?: boolean
 className?: string
 id?: string
 placeholder?: string
 searchPlaceholder?: string
 emptyMessage?: string
 emptyQueryMessage?: string
 "aria-label"?: string
}

function studentSearchableLabel(s: StudentSearchableOption): ReactNode {
 const code = s.student_code?.trim() ?? ""
 const gradeLabel = formatStudentGrade(s.grade)
 const bits: string[] = []
 if (code) bits.push(`學號 ${code}`)
 if (gradeLabel && gradeLabel !== "—") bits.push(gradeLabel)
 if (s.registration_status === "非注冊") bits.push("非註冊")
 return (
  <span className="flex min-w-0 flex-col gap-0.5">
   <span className="font-medium">{s.full_name}</span>
   {bits.length > 0 ? (
    <span className="text-xs text-muted-foreground">{bits.join(" · ")}</span>
   ) : null}
  </span>
 )
}

function sameIdList(a: readonly string[], b: readonly string[]): boolean {
 return a.length === b.length && a.every((id, i) => id === b[i])
}

export function StudentSearchableSelect({
 students,
 value,
 onChange,
 recentPaidStudentIds = [],
 rememberKey,
 disabled,
 className,
 id,
 placeholder = "請選擇學生",
 searchPlaceholder = "最近選過，或輸入姓名／學號／年級",
 emptyMessage = "找不到學生",
 emptyQueryMessage = "尚無最近使用的學生，請輸入姓名、學號或年級搜尋",
 "aria-label": ariaLabel,
}: Props) {
 const [rememberedIds, setRememberedIds] = useState<string[]>(() =>
  rememberKey ? readRecentStudentIds(rememberKey) : []
 )

 useEffect(() => {
  if (!rememberKey || !value.trim()) return
  setRememberedIds((prev) => {
   const next = touchRecentStudentId(prev, value)
   if (sameIdList(prev, next)) return prev
   writeRecentStudentIds(rememberKey, next)
   return next
  })
 }, [rememberKey, value])

 const options = useMemo<SearchableSelectOption[]>(
  () =>
   students.map((s) => ({
    value: s.id,
    searchText: studentSearchText(s),
    displayText: studentDisplayText(s),
    label: studentSearchableLabel(s),
   })),
  [students]
 )

 const optionByValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options])

 const emptyQueryOptions = useMemo(() => {
  const merged = mergeRecentStudentIds(rememberedIds, recentPaidStudentIds, RECENT_STUDENT_ID_LIMIT)
  const selected = value.trim()
  const ids =
   selected && !merged.includes(selected)
    ? [selected, ...merged].slice(0, RECENT_STUDENT_ID_LIMIT)
    : merged
  const list: SearchableSelectOption[] = []
  for (const studentId of ids) {
   const opt = optionByValue.get(studentId)
   if (opt) list.push(opt)
  }
  return list
 }, [optionByValue, recentPaidStudentIds, rememberedIds, value])

 return (
  <SearchableSelect
   combobox
   id={id}
   className={className}
   disabled={disabled}
   value={value}
   onChange={onChange}
   options={options}
   emptyQueryOptions={emptyQueryOptions}
   placeholder={placeholder}
   searchPlaceholder={searchPlaceholder}
   emptyMessage={emptyMessage}
   emptyQueryMessage={emptyQueryMessage}
   maxResults={40}
   aria-label={ariaLabel ?? placeholder}
  />
 )
}
