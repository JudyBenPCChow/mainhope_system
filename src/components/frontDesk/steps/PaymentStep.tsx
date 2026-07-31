import { Link, useNavigate } from "react-router-dom"

import { SectionCard } from "@/components/payments/paymentsUi"
import { Button } from "@/components/ui/button"
import type { StudentRecord } from "@/services/studentQueries"

type Props = {
 student: StudentRecord
 onPaymentDone: () => void
 onSkipPayment: () => void
}

/**
 * 精靈收款步：唔再內嵌出單（UI §15 單一入口）。
 * 導向 `/Payments`；略過或確認已收後繼續請假步。
 */
export function PaymentStep({ student, onPaymentDone, onSkipPayment }: Props) {
 const navigate = useNavigate()
 const paymentsUrl = `/Payments?studentId=${encodeURIComponent(student.id)}&mode=receive`

 return (
  <div className="space-y-4">
   <SectionCard
    title="收款／出單"
    description="所有收款統一喺「收款登記」處理，完成後會出現喺繳費紀錄，方便對帳。"
   >
    <div className="space-y-3 text-sm text-muted-foreground">
     <p>
      學生：
      <span className="font-medium text-foreground">
       {student.full_name}
       {student.student_code ? `（${student.student_code}）` : ""}
      </span>
     </p>
     <p>
      請到收款登記選報讀堂數或試堂項目、核對金額後出單。試堂半價／原價會自動計價，金額仍可人手修改。
     </p>
     <ul className="list-inside list-disc space-y-1">
      <li>收完錢可返回此精靈，撳「已完成收款，繼續」進入請假。</li>
      <li>若家長稍後再交，可「略過收款」。</li>
     </ul>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
     <Button type="button" onClick={() => navigate(paymentsUrl)}>
      前往收款登記
     </Button>
     <Button type="button" variant="outline" asChild>
      <Link to={paymentsUrl} target="_blank" rel="noreferrer">
       新分頁開啟收款登記
      </Link>
     </Button>
     <Button type="button" variant="secondary" onClick={onPaymentDone}>
      已完成收款，繼續請假
     </Button>
     <Button type="button" variant="ghost" onClick={onSkipPayment}>
      略過收款
     </Button>
    </div>
   </SectionCard>
  </div>
 )
}
