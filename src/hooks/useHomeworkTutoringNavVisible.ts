import { useEffect, useState } from "react"

import { useAuth } from "@/lib/authBootstrap"
import { getTeacherHomeworkTutoringNav } from "@/services/homeworkTutoringAccessQueries"

/** 行政／管理層／外星人：側欄「功課輔導」恆顯示。老師：僅已剔選入口。 */
export function useHomeworkTutoringNavVisible(): boolean {
  const { role, profile } = useAuth()
  const [visible, setVisible] = useState(role !== "teacher")

  useEffect(() => {
    if (role !== "teacher") {
      setVisible(true)
      return
    }
    const teacherId = profile?.teacherId
    if (!teacherId) {
      setVisible(false)
      return
    }
    let cancelled = false
    void getTeacherHomeworkTutoringNav(teacherId)
      .then((ok) => {
        if (!cancelled) setVisible(ok)
      })
      .catch(() => {
        if (!cancelled) setVisible(false)
      })
    return () => {
      cancelled = true
    }
  }, [role, profile?.teacherId])

  return visible
}
