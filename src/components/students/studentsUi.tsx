import { cn } from "@/lib/utils"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import {
 normalizeActivityStatus,
 normalizeAcademicStage,
 normalizeEnrollmentStatus,
 normalizeRegistrationStatus,
 registrationStatusLabel,
 type StudentRecord,
} from "@/services/studentQueries"
import {
 formatStudentGrade,
 normalizeStudentGrade,
 STUDENT_GRADE_CODES,
 STUDENT_GRADE_LABELS,
 type StudentGradeCode,
} from "@/lib/studentGrade"

export { STUDENT_GRADE_CODES, STUDENT_GRADE_LABELS, formatStudentGrade, type StudentGradeCode }
export const GENDER_CHIPS = ["男", "女"] as const

/** 家長／監護人關係的固定選項（新增與詳細頁共用） */
export const PARENT_RELATIONSHIP_OPTIONS = [
 "父親",
 "母親",
 "祖父母",
 "兄姊",
 "親屬",
 "監護人",
 "其他",
] as const

type ChoiceChipsProps<T extends string> = {
 options: readonly T[]
 value: string | null | undefined
 onChange: (value: T) => void
 label?: (value: T) => string
 className?: string
}

type StudentGradeChipsProps = {
 value: string | null | undefined
 onChange: (value: StudentGradeCode) => void
 className?: string
}

export function StudentGradeChips({ value, onChange, className }: StudentGradeChipsProps) {
 return (
  <ChoiceChips
   options={STUDENT_GRADE_CODES}
   value={normalizeStudentGrade(value) ?? ""}
   onChange={onChange}
   label={(code) => STUDENT_GRADE_LABELS[code]}
   className={className}
  />
 )
}

export function ChoiceChips<T extends string>({
 options,
 value,
 onChange,
 label,
 className,
}: ChoiceChipsProps<T>) {
 const selected = (value ?? "").trim()
 return (
  <div className={cn("flex flex-wrap gap-2", className)}>
   {options.map((opt) => {
    const active = selected === opt
    return (
     <button
      key={opt}
      type="button"
      onClick={() => onChange(opt)}
      className={cn(
       "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
       active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground hover:bg-muted/80"
      )}
     >
      {label ? label(opt) : opt}
     </button>
    )
   })}
  </div>
 )
}

type ParentRelationshipChipsProps = {
 value: string | null | undefined
 onChange: (value: string) => void
 className?: string
}

/**
 * 家長關係選項按鈕；若現有值不在固定清單（多為舊資料的自訂值），
 * 會將其作為額外選項一併顯示並保持選取，避免編輯時遺失原值。
 */
export function ParentRelationshipChips({ value, onChange, className }: ParentRelationshipChipsProps) {
 const current = (value ?? "").trim()
 const base = PARENT_RELATIONSHIP_OPTIONS as readonly string[]
 const options = current && !base.includes(current) ? [...base, current] : base
 return (
  <ChoiceChips
   options={options}
   value={current}
   onChange={onChange}
   className={className}
  />
 )
}

type StatusToggleProps = {
 checked: boolean
 onCheckedChange: (checked: boolean) => void
 offLabel: string
 onLabel: string
 id?: string
}

/** 雙態開關：關 = offLabel，開 = onLabel */
export function StatusToggle({ checked, onCheckedChange, offLabel, onLabel, id }: StatusToggleProps) {
 return (
  <div className="flex items-center gap-3">
   <span
    className={cn("min-w-[4.5rem] text-sm", !checked ? "font-medium text-foreground" : "text-muted-foreground")}
   >
    {offLabel}
   </span>
   <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
     "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
     checked ? "bg-primary" : "bg-muted"
    )}
   >
    <span
     className={cn(
      "pointer-events-none absolute top-0.5 block h-5 w-5 rounded-full bg-background shadow transition-transform",
      checked ? "translate-x-5" : "translate-x-0.5"
     )}
    />
   </button>
   <span
    className={cn("min-w-[4.5rem] text-sm", checked ? "font-medium text-foreground" : "text-muted-foreground")}
   >
    {onLabel}
   </span>
  </div>
 )
}

type StudentClassificationTagsProps = {
 student: Pick<
  StudentRecord,
  "registration_status" | "enrollment_status" | "activity_status" | "academic_stage"
 >
 size?: "sm" | "md"
 /** 列表等窄欄位用較短標籤文案 */
 compact?: boolean
 /** 主色標題列等深色底：標籤改用不透明淺底 pill */
 surface?: "default" | "onPrimary"
 className?: string
}

/** 學生四維業務分類標籤 */
export function StudentClassificationTags({
 student,
 size = "sm",
 compact = false,
 surface = "default",
 className,
}: StudentClassificationTagsProps) {
 const registration = normalizeRegistrationStatus(student.registration_status)
 const enrollment = normalizeEnrollmentStatus(student.enrollment_status)
 const activity = normalizeActivityStatus(student.activity_status)
 const stage = normalizeAcademicStage(student.academic_stage)
 const items = [
  {
   key: "registration",
   label: compact
    ? registration === "非注冊"
      ? "非註冊"
      : "註冊"
    : registrationStatusLabel(registration),
   title:
    registration === "已註冊"
     ? "客戶身份：已註冊為正式學生"
     : "客戶身份：非註冊（試堂／查詢等尚未註冊）",
   tone: statusToTagTone(registration),
  },
  {
   key: "enrollment",
   label: enrollment,
   title: "就讀狀態：目前是否有就讀中報讀（自動計算）",
   tone: statusToTagTone(enrollment),
  },
  {
   key: "activity",
   label: activity,
   title: "互動狀態：近三個月有報讀活動（可能含近期退讀，不等於目前在讀）",
   tone: statusToTagTone(activity),
  },
  {
   key: "stage",
   label: stage,
   title: "學業階段",
   tone: statusToTagTone(stage),
  },
 ] as const
 return (
  <div className={cn("flex flex-wrap gap-1", className)}>
   {items.map((item) => (
    <Tag key={item.key} tone={item.tone} size={size} surface={surface} title={item.title}>
     {item.label}
    </Tag>
   ))}
  </div>
 )
}
