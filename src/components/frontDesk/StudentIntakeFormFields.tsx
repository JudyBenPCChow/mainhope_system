import { useMemo, useState } from "react"

import {
 ChoiceChips,
 GENDER_CHIPS,
 ParentRelationshipChips,
 StatusToggle,
 StudentGradeChips,
} from "@/components/students/studentsUi"
import { Field } from "@/components/frontDesk/frontDeskUi"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { normalizeStudentGrade } from "@/lib/studentGrade"
import type { FrontDeskIntakePayload } from "@/services/frontDeskIntakeQueries"
import { PHONE_COUNTRY_CODES, PREFERRED_CONTACT_METHODS } from "@/services/studentQueries"

const COMMON_HK_SCHOOLS = [
 "英華書院",
 "聖保羅男女中學",
 "拔萃女書院",
 "喇沙書院",
 "華仁書院",
 "協恩中學",
 "伊利沙伯中學",
 "皇仁書院",
 "拔萃男書院",
 "聖若瑟書院",
] as const

export function emptyIntakeForm(): FrontDeskIntakePayload {
 return {
  full_name: "",
  english_name: "",
  gender: "",
  grade: "",
  registration_status: "已註冊",
  academic_stage: "中學階段",
  school: "",
  date_of_birth: "",
  parent_name: "",
  parent_relationship: "",
  student_phone: "",
  student_phone_country_code: "+852",
  parent_phone: "",
  parent_phone_country_code: "+852",
  whatsapp: "",
  preferred_contact_method: "",
  address: "",
  remarks: "",
 }
}

export function payloadFromPartial(p: Partial<FrontDeskIntakePayload> | null | undefined): FrontDeskIntakePayload {
 const base = emptyIntakeForm()
 if (!p) return base
 return { ...base, ...p, full_name: (p.full_name ?? "").trim() ? String(p.full_name) : "" }
}

type Props = {
 value: FrontDeskIntakePayload
 onChange: (next: FrontDeskIntakePayload) => void
 disabled?: boolean
 /** 家長頁隱藏職員用語 */
 parentFacing?: boolean
 extraSchools?: string[]
 showStudentCode?: string | null
}

export function StudentIntakeFormFields({
 value,
 onChange,
 disabled,
 parentFacing,
 extraSchools = [],
 showStudentCode,
}: Props) {
 const [schoolSearch, setSchoolSearch] = useState("")
 const schoolOptions = useMemo(() => {
  return [...new Set([...COMMON_HK_SCHOOLS, ...extraSchools])].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [extraSchools])
 const schoolFiltered = useMemo(() => {
  const q = schoolSearch.trim().toLowerCase()
  if (!q) return schoolOptions
  return schoolOptions.filter((s) => s.toLowerCase().includes(q))
 }, [schoolOptions, schoolSearch])

 const patch = (partial: Partial<FrontDeskIntakePayload>) => onChange({ ...value, ...partial })

 return (
  <div className="space-y-6">
   <section className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">基本資料</h3>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label="中文姓名 *">
      <Input
       disabled={disabled}
       value={value.full_name ?? ""}
       onChange={(e) => patch({ full_name: e.target.value })}
      />
     </Field>
     <Field label="英文姓名">
      <Input
       disabled={disabled}
       value={value.english_name ?? ""}
       onChange={(e) => patch({ english_name: e.target.value })}
      />
     </Field>
     {showStudentCode != null ? (
      <Field label="學生編號">
       <Input value={showStudentCode} readOnly className="bg-muted/30" />
      </Field>
     ) : null}
     <Field label="性別">
      <ChoiceChips
       options={GENDER_CHIPS}
       value={value.gender ?? ""}
       onChange={(gender) => patch({ gender })}
      />
     </Field>
     <Field label="年級">
      <StudentGradeChips value={value.grade} onChange={(grade) => patch({ grade })} />
     </Field>
     {!parentFacing ? (
      <>
       <Field label="注冊狀態">
        <StatusToggle
         checked={(value.registration_status ?? "已註冊") === "已註冊"}
         onCheckedChange={(on) => patch({ registration_status: on ? "已註冊" : "非注冊" })}
         offLabel="非注冊（試堂／查詢）"
         onLabel="注冊"
        />
       </Field>
       <Field label="學業階段">
        <StatusToggle
         checked={(value.academic_stage ?? "中學階段") === "中學階段"}
         onCheckedChange={(on) => patch({ academic_stage: on ? "中學階段" : "已畢業" })}
         offLabel="已畢業"
         onLabel="中學階段"
        />
       </Field>
      </>
     ) : null}
     <Field label="學校" className="sm:col-span-2">
      <div className="space-y-2">
       <Input
        disabled={disabled}
        value={schoolSearch}
        onChange={(e) => setSchoolSearch(e.target.value)}
        placeholder="搜尋學校…"
       />
       <Select
        disabled={disabled}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value.school ?? ""}
        onChange={(e) => patch({ school: e.target.value })}
       >
        <option value="">請選擇學校</option>
        {schoolFiltered.map((s) => (
         <option key={s} value={s}>
          {s}
         </option>
        ))}
       </Select>
      </div>
     </Field>
     <Field label="出生日期">
      <Input
       disabled={disabled}
       type="date"
       value={(value.date_of_birth ?? "").slice(0, 10)}
       onChange={(e) => patch({ date_of_birth: e.target.value })}
      />
     </Field>
    </div>
   </section>

   <section className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">家長聯絡</h3>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label="家長姓名">
      <Input
       disabled={disabled}
       value={value.parent_name ?? ""}
       onChange={(e) => patch({ parent_name: e.target.value })}
      />
     </Field>
     <Field label="關係">
      <ParentRelationshipChips
       value={value.parent_relationship}
       onChange={(rel) => patch({ parent_relationship: rel })}
      />
     </Field>
     <Field label="學生電話">
      <div className="space-y-2">
       <ChoiceChips
        options={PHONE_COUNTRY_CODES}
        value={value.student_phone_country_code ?? "+852"}
        onChange={(code) => patch({ student_phone_country_code: code })}
       />
       <Input
        disabled={disabled}
        inputMode="numeric"
        value={value.student_phone ?? ""}
        onChange={(e) => patch({ student_phone: e.target.value })}
       />
      </div>
     </Field>
     <Field label="家長電話">
      <div className="space-y-2">
       <ChoiceChips
        options={PHONE_COUNTRY_CODES}
        value={value.parent_phone_country_code ?? "+852"}
        onChange={(code) => patch({ parent_phone_country_code: code })}
       />
       <Input
        disabled={disabled}
        inputMode="numeric"
        value={value.parent_phone ?? ""}
        onChange={(e) => patch({ parent_phone: e.target.value })}
       />
      </div>
     </Field>
     <Field label="WhatsApp 號碼">
      <Input
       disabled={disabled}
       inputMode="numeric"
       value={value.whatsapp ?? ""}
       onChange={(e) => patch({ whatsapp: e.target.value })}
      />
     </Field>
     <Field label="偏好通訊方式">
      <ChoiceChips
       options={PREFERRED_CONTACT_METHODS}
       value={value.preferred_contact_method ?? ""}
       onChange={(m) => patch({ preferred_contact_method: m })}
      />
     </Field>
     <Field label="地址" className="sm:col-span-2">
      <Input
       disabled={disabled}
       value={value.address ?? ""}
       onChange={(e) => patch({ address: e.target.value })}
      />
     </Field>
     <Field label="備註" className="sm:col-span-2">
      <Textarea
       disabled={disabled}
       value={value.remarks ?? ""}
       onChange={(e) => patch({ remarks: e.target.value })}
       rows={3}
      />
     </Field>
    </div>
   </section>
  </div>
 )
}

export function normalizeIntakeForInsert(form: FrontDeskIntakePayload) {
 const reg = form.registration_status === "非注冊" ? "非注冊" : "已註冊"
 return {
  full_name: (form.full_name ?? "").trim(),
  english_name: (form.english_name ?? "").trim() || null,
  gender: (form.gender ?? "").trim() || null,
  grade: normalizeStudentGrade(form.grade),
  registration_status: reg,
  academic_stage: form.academic_stage === "已畢業" ? "已畢業" : "中學階段",
  school: (form.school ?? "").trim() || null,
  date_of_birth: (form.date_of_birth ?? "").trim() || null,
  parent_name: (form.parent_name ?? "").trim() || null,
  parent_relationship: (form.parent_relationship ?? "").trim() || null,
  student_phone: (form.student_phone ?? "").trim() || null,
  student_phone_country_code: form.student_phone_country_code === "+86" ? "+86" : "+852",
  parent_phone: (form.parent_phone ?? "").trim() || null,
  parent_phone_country_code: form.parent_phone_country_code === "+86" ? "+86" : "+852",
  whatsapp: (form.whatsapp ?? "").trim() || null,
  preferred_contact_method:
   form.preferred_contact_method === "WeChat" || form.preferred_contact_method === "WhatsApp"
    ? form.preferred_contact_method
    : null,
  address: (form.address ?? "").trim() || null,
  remarks: (form.remarks ?? "").trim() || null,
 } as const
}
