import { useEffect, useState } from "react"

import { useAuth } from "@/lib/authBootstrap"
import { getTeacherHomeworkNavFlags } from "@/services/homeworkTutoringAccessQueries"

export type TeacherHomeworkNavFlags = {
  /** 側欄是否顯示「功課輔導」分組 */
  homeworkTutoringNavVisible: boolean
  /** true＝純功輔導師側欄（隱藏專科項目） */
  homeworkTutorOnly: boolean
}

const NON_TEACHER: TeacherHomeworkNavFlags = {
  homeworkTutoringNavVisible: true,
  homeworkTutorOnly: false,
}

/** 行政／管理層／外星人：功輔分組恆顯示、非純功輔。老師：跟 teachers 旗標。 */
export function useTeacherHomeworkNavFlags(): TeacherHomeworkNavFlags {
  const { role, profile } = useAuth()
  const [flags, setFlags] = useState<TeacherHomeworkNavFlags>(() =>
    role === "teacher" ? { homeworkTutoringNavVisible: false, homeworkTutorOnly: false } : NON_TEACHER
  )

  useEffect(() => {
    if (role !== "teacher") {
      setFlags(NON_TEACHER)
      return
    }
    const teacherId = profile?.teacherId
    if (!teacherId) {
      setFlags({ homeworkTutoringNavVisible: false, homeworkTutorOnly: false })
      return
    }
    let cancelled = false
    void getTeacherHomeworkNavFlags(teacherId)
      .then((next) => {
        if (!cancelled) setFlags(next)
      })
      .catch(() => {
        if (!cancelled) {
          setFlags({ homeworkTutoringNavVisible: false, homeworkTutorOnly: false })
        }
      })
    return () => {
      cancelled = true
    }
  }, [role, profile?.teacherId])

  return flags
}

/** @deprecated 改用 useTeacherHomeworkNavFlags；保留相容舊呼叫 */
export function useHomeworkTutoringNavVisible(): boolean {
  return useTeacherHomeworkNavFlags().homeworkTutoringNavVisible
}
