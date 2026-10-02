import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"

import "@/components/adTrial/adHomeworkPublic.css"
import { AD_HOMEWORK_WHILE_WAITING } from "@/lib/adPublicLandingCopy"
import {
  AD_PUBLIC_CONTACT,
  adPublicTelHref,
  adPublicWhatsAppPrefill,
} from "@/lib/adPublicContact"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"
import { initAdPublicTracking } from "@/lib/adTracking"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"

type ThanksState = {
  fullName?: string
  summaryLines?: string[]
}

export default function AdHomeworkThanks() {
  const location = useLocation()
  const state = (location.state ?? {}) as ThanksState
  const lines = Array.isArray(state.summaryLines) ? state.summaryLines.filter(Boolean) : []

  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
    initAdPublicTracking()
  }, [])

  const openWhatsApp = () =>
    openWhatsAppWithPrefilledText(
      AD_PUBLIC_CONTACT.whatsappDigits,
      adPublicWhatsAppPrefill("homework", state.fullName)
    )

  return (
    <div className="ad-hw">
      <div className="shell thanks">
        <h1>已收到登記</h1>
        <p className="lead">本社會盡快以 WhatsApp 與你聯絡，確認時間及安排。</p>
        {lines.length > 0 ? (
          <ul className="summary">
            {lines.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : null}
        <div className="hero-cta">
          <button type="button" className="btn btn-primary" onClick={openWhatsApp}>
            WhatsApp
          </button>
          <a className="btn btn-ghost" href={adPublicTelHref()}>
            致電 {AD_PUBLIC_CONTACT.phoneDisplay}
          </a>
        </div>
        <div className="thanks-sub">
          <h2>等候期間，你可以先了解</h2>
          <ul className="check-list">
            {AD_HOMEWORK_WHILE_WAITING.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="thanks-links">
          <Link to="/AdHomework">返回登記頁</Link>
          <span> · </span>
          <Link to="/Privacy">私隱政策</Link>
        </p>
      </div>
      <footer className="site">
        <div className="shell">
          <p className="brand-lockup">
            {AD_PUBLIC_CONTACT.brandZh}
            <span>{AD_PUBLIC_CONTACT.brandEn}</span>
          </p>
          <dl>
            <dt>地址</dt>
            <dd>{AD_PUBLIC_CONTACT.addressZh}</dd>
            <dt>電話</dt>
            <dd>
              <a href={adPublicTelHref()}>{AD_PUBLIC_CONTACT.phoneDisplay}</a>
            </dd>
          </dl>
        </div>
      </footer>
      <nav className="sticky-bar" aria-label="跟進聯絡">
        <button type="button" className="btn btn-primary" onClick={openWhatsApp}>
          WhatsApp
        </button>
        <a className="btn btn-ghost" href={adPublicTelHref()}>
          致電
        </a>
      </nav>
    </div>
  )
}
