import { useEffect } from "react"
import { Link } from "react-router-dom"

import {
  AD_PUBLIC_CONTACT,
  adPublicTelHref,
} from "@/lib/adPublicContact"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"
import { initAdPublicTracking } from "@/lib/adTracking"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"

/**
 * 廣告公開頁暫用私隱說明。完整法務正文待營運提供後再替換。
 * 路由在 Layout 外，與 /AdTrial 同級。
 */
export default function AdPublicPrivacy() {
  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
    initAdPublicTracking()
  }, [])

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-16">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{AD_PUBLIC_CONTACT.brandZh}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">私隱政策（暫用）</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        本頁說明透過廣告公開頁（新生試堂登記／查詢登記）收集個人資料的用途。完整書面私隱政策正文待補充後會取代本說明。
      </p>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-base font-semibold">資料控制者</h2>
        <p>
          {AD_PUBLIC_CONTACT.companyZh}（{AD_PUBLIC_CONTACT.companyEn}）
          <br />
          {AD_PUBLIC_CONTACT.addressZh}
          <br />
          註冊教育編號 {AD_PUBLIC_CONTACT.educationRegNo}
        </p>

        <h2 className="pt-2 text-base font-semibold">收集的資料</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>姓名、學校、年級、選修科（如適用）</li>
          <li>聯絡方式：WhatsApp 電話或微信 ID</li>
          <li>有興趣的科目／試堂意向、備註（如有填寫）</li>
          <li>為防濫用而記錄的技術資料（例如提交來源 IP、人機驗證結果）</li>
        </ul>

        <h2 className="pt-2 text-base font-semibold">用途</h2>
        <p className="text-muted-foreground">
          僅用於回覆查詢、安排試堂、說明收費與跟進報讀；不會出售予無關第三方。若你同意本政策並提交表單，本社可能為廣告成效歸因與再營銷，將電話號碼以雜湊方式提供 Meta（Facebook／Instagram）等廣告平台；細節見完整政策定稿後更新。
        </p>

        <h2 className="pt-2 text-base font-semibold">聯絡本社</h2>
        <p className="text-muted-foreground">
          電話：{" "}
          <a className="text-foreground underline underline-offset-2" href={adPublicTelHref()}>
            {AD_PUBLIC_CONTACT.phoneDisplay}
          </a>
          <br />
          WhatsApp：{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-2"
            onClick={() =>
              openWhatsAppWithPrefilledText(
                AD_PUBLIC_CONTACT.whatsappDigits,
                "想查詢私隱政策／個人資料事宜"
              )
            }
          >
            {AD_PUBLIC_CONTACT.whatsappDisplay}
          </button>
          <br />
          官網：{" "}
          <a
            className="text-foreground underline underline-offset-2"
            href={AD_PUBLIC_CONTACT.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {AD_PUBLIC_CONTACT.website.replace(/\/$/, "")}
          </a>
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link to="/AdInterest" className="text-primary underline underline-offset-2">
          返回查詢登記
        </Link>
        <span className="mx-2 text-muted-foreground">·</span>
        <Link to="/AdTrial" className="text-primary underline underline-offset-2">
          返回試堂登記
        </Link>
      </p>
    </div>
  )
}
