import { HomeworkTutoringApp } from "@/components/homeworkTutoring/HomeworkTutoringApp"
import { useHomeworkTutoringNavVisible } from "@/hooks/useHomeworkTutoringNavVisible"

export default function HomeworkDayLogs() {
  const teacherNavVisible = useHomeworkTutoringNavVisible()
  return <HomeworkTutoringApp teacherNavVisible={teacherNavVisible} />
}
