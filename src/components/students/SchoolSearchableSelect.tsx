import { useMemo } from "react"

import { SearchableSelect } from "@/components/ui/searchable-select"
import { buildSchoolSelectOptions, normalizeSchoolSearchKey } from "@/lib/hkSecondarySchools"

type Props = {
 value: string
 onChange: (school: string) => void
 extraSchools?: readonly string[]
 /** 不傳則用全港中學。小學登記傳 HK_PRIMARY_SCHOOLS。 */
 schools?: readonly string[]
 disabled?: boolean
}

export function SchoolSearchableSelect({ value, onChange, extraSchools = [], schools, disabled }: Props) {
 const options = useMemo(
  () => buildSchoolSelectOptions(extraSchools, value, schools),
  [extraSchools, value, schools]
 )
 return (
  <SearchableSelect
   combobox
   allowCustomValue
   value={value}
   onChange={onChange}
   options={options}
   placeholder="請選擇學校"
   searchPlaceholder="搜尋學校…"
   emptyMessage="沒有符合的學校"
   normalizeSearch={normalizeSchoolSearchKey}
   aria-label="學校"
   disabled={disabled}
  />
 )
}
