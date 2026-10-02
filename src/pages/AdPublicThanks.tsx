import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { CheckCircle2, MessageCircle, Phone } from "lucide-react"

import { AdPublicSiteFooter } from "@/components/adTrial/AdPublicChrome"
import { Button } from "@/components/ui/button"
import { AD_TRUST_BULLETS } from "@/lib/adPublicLandingCopy"
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

export type AdThanksMode = "trial" | "interest" | "homework"

/** 廣告轉換感謝頁。標題固定，不依賴重新整理後會消失的 state。 */
export default function AdPublicThanks({ mode }: { mode: AdThanksMode }) {
  const location = useLocation()
  const state = (location.state ?? {}) as AdThanksState
  const backTo = mode === "interest" ? "/AdInterest" : mode === "homework" ? "/AdHomework" : "/AdTrial"

  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
    initAdPublicTracking()
  }, [])

  const lines = Array.isArray(state.summaryLines) ? state.summaryLines.filter(Boolean) : []
  const openWhatsApp = () =>
    openWhatsAppWithPrefilledText(AD_PUBLIC_CONTACT.whatsappDigits, adPublicWhatsAppPrefill(mode, state.fullName))

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-28">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{AD_PUBLIC_CONTACT.brandZh}</p>
      <section className="mt-6 space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">已收到登記</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          本社會盡快以 WhatsApp 與你聯絡，確認時間及安排。
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
          <Button type="button" className="w-full gap-2 sm:flex-1" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp 本社（一按即開）
          </Button>
          <Button type="button" variant="outline" className="w-full gap-2 sm:flex-1" asChild>
            <a href={adPublicTelHref()}>
              <Phone className="h-4 w-4" aria-hidden />
              致電 {AD_PUBLIC_CONTACT.phoneDisplay}
            </a>
          </Button>
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">等候期間，你可以先了解</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {AD_TRUST_BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link to={backTo} className="text-primary underline underline-offset-2">
          返回登記頁
        </Link>
        <span className="mx-2 text-muted-foreground">·</span>
        <Link to="/Privacy" className="text-muted-foreground underline underline-offset-2">
          私隱政策
        </Link>
      </p>

      <AdPublicSiteFooter />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        aria-label="跟進聯絡"
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <Button type="button" className="flex-1 gap-1.5" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp 即時問
          </Button>
          <Button type="button" variant="outline" className="flex-1 gap-1.5" asChild>
            <a href={adPublicTelHref()}>
              <Phone className="h-4 w-4" aria-hidden />
              致電
            </a>
          </Button>
        </div>
      </nav>
    </div>
  )
}
