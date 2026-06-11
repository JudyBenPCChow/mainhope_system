import { useCallback, useState } from "react"

import {
 getStoredAcademicYearFilter,
 setStoredAcademicYearFilter,
} from "@/lib/academicYearFilter"

/** 跨頁面、重新載入後仍保留的學年篩選（localStorage `mgmt_academic_year_filter`） */
export function useAcademicYearFilter() {
 const [academicYearFilter, setFilterState] = useState(getStoredAcademicYearFilter)

 const setAcademicYearFilter = useCallback((value: string) => {
  setStoredAcademicYearFilter(value)
  setFilterState(value)
 }, [])

 return [academicYearFilter, setAcademicYearFilter] as const
}
