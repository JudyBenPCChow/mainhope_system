import { Link } from "react-router-dom"
import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AD_PUBLIC_CONTACT } from "@/lib/adPublicContact"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"

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

/** 主按鈕留在頁內；WhatsApp 為副按鈕。電話放在頁尾。 */
export function AdPublicStickyBar({
  primaryLabel,
  onPrimary,
  whatsappText,
}: {
  primaryLabel: string
  onPrimary: () => void
  whatsappText: string
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="登記與聯絡"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <Button type="button" className="flex-1" onClick={onPrimary}>
          {primaryLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => openWhatsAppWithPrefilledText(AD_PUBLIC_CONTACT.whatsappDigits, whatsappText)}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp 即時問
        </Button>
      </div>
    </nav>
  )
}
