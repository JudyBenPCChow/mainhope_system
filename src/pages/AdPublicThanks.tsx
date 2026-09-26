import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { CheckCircle2, MessageCircle, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AD_PUBLIC_CONTACT,
  adPublicTelHref,
  adPublicWhatsAppPrefill,
} from "@/lib/adPublicContact"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"
import { initAdPublicTracking } from "@/lib/adTracking"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"

export type AdThanksState = {
  fullName?: string
  summaryLines?: string[]
}

/** 廣告轉換感謝頁：供 Meta／GA「到達網址」與 PageView／事後跟進。 */
export default function AdPublicThanks({ mode }: { mode: "trial" | "interest" }) {
  const location = useLocation()
  const state = (location.state ?? {}) as AdThanksState
  const interestOnly = mode === "interest"
  const backTo = interestOnly ? "/AdInterest" : "/AdTrial"

  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
    initAdPublicTracking()
  }, [])

  const lines = Array.isArray(state.summaryLines) ? state.summaryLines.filter(Boolean) : []

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-28">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{AD_PUBLIC_CONTACT.brandZh}</p>
      <section className="mt-6 space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {interestOnly ? "已收到查詢" : "已收到試堂登記"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {interestOnly
            ? "職員會以 WhatsApp 聯絡，按你有興趣的科目說明安排與收費。此頁不會即時留位或收款。"
            : "職員會以 WhatsApp 聯絡，核對學校與年級、確認試堂日期，並說明該堂收費。此頁不會即時留位或收款。"}
        </p>
        {lines.length > 0 ? (
          <ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm">
            {lines.map((label) => (
              <li key={label} className="font-medium text-foreground">
                {label}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="w-full gap-2 sm:flex-1"
            onClick={() =>
              openWhatsAppWithPrefilledText(
                AD_PUBLIC_CONTACT.whatsappDigits,
                adPublicWhatsAppPrefill(mode, state.fullName)
              )
            }
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp 聯絡我們
          </Button>
          <Button type="button" variant="outline" className="w-full gap-2 sm:flex-1" asChild>
            <a href={adPublicTelHref()}>
              <Phone className="h-4 w-4" aria-hidden />
              致電 {AD_PUBLIC_CONTACT.phoneDisplay}
            </a>
          </Button>
        </div>
        <p className="pt-4 text-sm">
          <Link to={backTo} className="text-primary underline underline-offset-2">
            返回登記頁
          </Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link to="/Privacy" className="text-muted-foreground underline underline-offset-2">
            私隱政策
          </Link>
        </p>
      </section>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        aria-label="快速聯絡"
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <Button type="button" variant="outline" className="flex-1 gap-1.5" asChild>
            <a href={adPublicTelHref()}>
              <Phone className="h-4 w-4" aria-hidden />
              電話
            </a>
          </Button>
          <Button
            type="button"
            className="flex-1 gap-1.5"
            onClick={() =>
              openWhatsAppWithPrefilledText(
                AD_PUBLIC_CONTACT.whatsappDigits,
                adPublicWhatsAppPrefill(mode, state.fullName)
              )
            }
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp
          </Button>
        </div>
      </nav>
    </div>
  )
}
