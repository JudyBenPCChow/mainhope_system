import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { CheckCircle2, MessageCircle, Phone } from "lucide-react"

import { AdPublicSiteFooter } from "@/components/adTrial/AdPublicChrome"
import { Button } from "@/components/ui/button"
import "@/components/adTrial/adInterestPublic.css"
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
  contactMethod?: "WhatsApp" | "WeChat"
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
  const contactLabel = state.contactMethod === "WeChat" ? "WeChat" : "WhatsApp"
  const openWhatsApp = () =>
    openWhatsAppWithPrefilledText(AD_PUBLIC_CONTACT.whatsappDigits, adPublicWhatsAppPrefill(mode, state.fullName))

  if (mode === "interest") {
    return (
      <div className="ad-int" data-motion="off">
        <div className="topbar">
          <div className="shell">
            <Link className="brand" to="/AdInterest">
              <img src="/images/ad/mainhope-logo-mark.png" alt="明學教育標誌" width={34} height={34} />
              <span>
                <b>{AD_PUBLIC_CONTACT.brandZh}</b>
                <small>MAIN HOPE EDUCATION</small>
              </span>
            </Link>
            <a className="tel" href={adPublicTelHref()}>
              電話 {AD_PUBLIC_CONTACT.phoneDisplay}
            </a>
          </div>
        </div>

        <main id="top">
          <section className="band">
            <div className="shell thanks-wrap">
              <div className="thanks-card">
                <p className="thanks-mark" aria-hidden="true">
                  ✓
                </p>
                <h1>已收到查詢登記</h1>
                <p className="thanks-lead">
                  本社會盡快以你指定的聯絡方式（{contactLabel}）確認。此頁沒有即時留位或收款。
                </p>
                {state.fullName ? <p className="thanks-name">{state.fullName}</p> : null}
                {lines.length > 0 ? (
                  <ul className="thanks-subjects">
                    {lines.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="cta">
                  {state.contactMethod === "WeChat" ? (
                    <p className="thanks-wechat">
                      請留意 WeChat「{AD_PUBLIC_CONTACT.wechat}」。如需改用 WhatsApp，可按下方按鈕。
                    </p>
                  ) : null}
                  <button type="button" className="btn btn-primary" onClick={openWhatsApp}>
                    WhatsApp 本社
                  </button>
                  <a className="btn btn-ghost" href={adPublicTelHref()}>
                    致電 {AD_PUBLIC_CONTACT.phoneDisplay}
                  </a>
                </div>
                <p className="thanks-back">
                  <Link to={backTo}>返回查詢頁</Link>
                  {" · "}
                  <Link to="/Privacy">私隱政策</Link>
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="site-foot">
          <div className="shell foot-grid">
            <div>
              <p className="foot-brand">
                {AD_PUBLIC_CONTACT.companyZh}
                <small>{AD_PUBLIC_CONTACT.companyEn}</small>
              </p>
              <p>{AD_PUBLIC_CONTACT.addressZh}</p>
              <p>註冊教育編號 {AD_PUBLIC_CONTACT.educationRegNo}</p>
            </div>
            <div>
              <p>
                電話 <a href={adPublicTelHref()}>{AD_PUBLIC_CONTACT.phoneDisplay}</a>
                {" · "}
                WhatsApp{" "}
                <a
                  href={`https://wa.me/${AD_PUBLIC_CONTACT.whatsappDigitsIntl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {AD_PUBLIC_CONTACT.whatsappDisplay}
                </a>
                {" · "}
                微信 {AD_PUBLIC_CONTACT.wechat}
              </p>
            </div>
          </div>
        </footer>

        <nav className="sticky-bar" aria-label="跟進聯絡">
          <div className="shell">
            <button type="button" className="btn btn-primary" onClick={openWhatsApp}>
              WhatsApp 即時問
            </button>
            <a className="btn btn-ghost" href={adPublicTelHref()}>
              致電
            </a>
          </div>
        </nav>
      </div>
    )
  }

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
