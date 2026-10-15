import { Link } from "react-router-dom"

import { AD_PUBLIC_CONTACT } from "@/lib/adPublicContact"

export function AdPublicSiteFooter() {
  return (
    <footer className="mt-10 space-y-2 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
      <p className="font-medium text-foreground">
        {AD_PUBLIC_CONTACT.companyZh}
        <span className="font-normal text-muted-foreground"> · {AD_PUBLIC_CONTACT.companyEn}</span>
      </p>
      <p>{AD_PUBLIC_CONTACT.addressZh}</p>
      <p>
        電話 {AD_PUBLIC_CONTACT.phoneDisplay} · WhatsApp {AD_PUBLIC_CONTACT.whatsappDisplay} · 微信{" "}
        {AD_PUBLIC_CONTACT.wechat}
      </p>
      <p>註冊教育編號 {AD_PUBLIC_CONTACT.educationRegNo}</p>
      <p>
        <Link to="/Privacy" className="underline underline-offset-2 hover:text-foreground">
          私隱政策
        </Link>
        <span className="mx-1.5">·</span>
        <a
          href={AD_PUBLIC_CONTACT.website}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          官網
        </a>
      </p>
    </footer>
  )
}
