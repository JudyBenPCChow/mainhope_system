import type { ReactNode } from "react"

/** 串接學生名稱（頓號分隔） */
export function formatStudentNameList(names: string[]): string {
 return names.join("、")
}

/** 日期與時間範圍字串（加大視覺間距用於非 JSX 場合） */
export function formatScheduleDateTimeText(
 date: string,
 startTime: string | null,
 endTime: string | null
): string {
 const time =
  startTime && endTime ? `${startTime}–${endTime}` : startTime ?? endTime ?? ""
 if (!time) return date
 return `${date}    ${time}`
}

export type ScheduleDateTimeProps = {
 date: string
 startTime: string | null
 endTime: string | null
 className?: string
}

/** 日期與時間 JSX（flex + gap 加大間距） */
export function ScheduleDateTime({
 date,
 startTime,
 endTime,
 className,
}: ScheduleDateTimeProps): ReactNode {
 const time =
  startTime && endTime ? `${startTime}–${endTime}` : startTime ?? endTime ?? ""
 return (
  <span className={className}>
   <span className="tabular-nums">{date}</span>
   {time ? (
    <>
     <span className="mx-4 text-muted-foreground/50" aria-hidden>
      ·
     </span>
     <span className="tabular-nums">{time}</span>
    </>
   ) : null}
  </span>
 )
}
