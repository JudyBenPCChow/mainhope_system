import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { FlaskConical, Printer, X } from "lucide-react"

import { Button } from "@/components/ui/button"

import { mockPublicLink, type CampaignRow } from "./campaignMockData"

const PRINT_STYLE_ID = "contact-update-print-slips-style"

const PRINT_CSS = `
@media screen {
  .cu-print-root {
    position: fixed;
    inset: 0;
    z-index: 280;
    overflow: auto;
    background: #e8e8e8;
  }
  .cu-print-toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #d4d4d4;
  }
  .cu-print-sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 16px auto;
    padding: 22mm 20mm;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,.1);
    box-sizing: border-box;
  }
}
@media print {
  body * {
    visibility: hidden !important;
  }
  .cu-print-root,
  .cu-print-root * {
    visibility: visible !important;
  }
  .cu-print-root {
    position: static !important;
    inset: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }
  .cu-print-toolbar {
    display: none !important;
  }
  .cu-print-sheet {
    width: auto;
    min-height: auto;
    margin: 0;
    padding: 12mm 14mm;
    box-shadow: none;
    page-break-after: always;
    break-after: page;
  }
  .cu-print-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }
}
.cu-slip-brand {
  font-size: 11pt;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #243357;
}
.cu-slip-title {
  margin: 10px 0 0;
  font-size: 22pt;
  font-weight: 700;
  color: #243357;
  letter-spacing: 0.06em;
}
.cu-slip-student {
  margin-top: 28px;
  padding: 16px 18px;
  border: 1px solid #d5dbe8;
  border-radius: 8px;
  background: #f7f8fb;
}
.cu-slip-name {
  margin: 0;
  font-size: 28pt;
  font-weight: 700;
  line-height: 1.2;
  color: #111;
}
.cu-slip-meta {
  margin: 8px 0 0;
  font-size: 12pt;
  color: #5a6578;
}
.cu-slip-qr-wrap {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.cu-slip-qr {
  width: 200px;
  height: 200px;
  image-rendering: pixelated;
}
.cu-slip-qr-hint {
  margin: 12px 0 0;
  font-size: 11pt;
  color: #5a6578;
}
.cu-slip-guide {
  margin-top: 28px;
}
.cu-slip-guide h2 {
  margin: 0 0 10px;
  font-size: 13pt;
  font-weight: 700;
  color: #243357;
}
.cu-slip-guide ol {
  margin: 0;
  padding-left: 1.25em;
  font-size: 11pt;
  line-height: 1.65;
  color: #222;
}
.cu-slip-link {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px dashed #d5dbe8;
}
.cu-slip-link .label {
  margin: 0 0 6px;
  font-size: 10pt;
  color: #5a6578;
}
.cu-slip-link .url {
  margin: 0;
  font-size: 9.5pt;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #243357;
}
.cu-slip-footer {
  margin-top: 36px;
  font-size: 9pt;
  color: #8a93a3;
}
`

type SlipRow = Pick<
  CampaignRow,
  "id" | "full_name" | "student_code" | "grade_label" | "school" | "token"
> & { token: string }

function injectPrintCss() {
  if (document.getElementById(PRINT_STYLE_ID)) return
  const el = document.createElement("style")
  el.id = PRINT_STYLE_ID
  el.textContent = PRINT_CSS
  document.head.appendChild(el)
}

function removePrintCss() {
  document.getElementById(PRINT_STYLE_ID)?.remove()
}

/**
 * 一人一頁打印預覽：姓名、學號、QR、指引、連結。
 * 沙盒專用；不接 DB。
 */
export function ContactUpdatePrintSlips({
  rows,
  onClose,
}: {
  rows: SlipRow[]
  onClose: () => void
}) {
  const [qrByToken, setQrByToken] = useState<Record<string, string>>({})

  useEffect(() => {
    injectPrintCss()
    return () => removePrintCss()
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const next: Record<string, string> = {}
      for (const r of rows) {
        const url = mockPublicLink(r.token)
        try {
          next[r.token] = await QRCode.toDataURL(url, {
            width: 400,
            margin: 1,
            errorCorrectionLevel: "M",
            color: { dark: "#243357", light: "#ffffff" },
          })
        } catch {
          /* skip */
        }
      }
      if (!cancelled) setQrByToken(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [rows])

  return (
    <div className="cu-print-root" role="dialog" aria-label="學生資料更新頁打印預覽">
      <div className="cu-print-toolbar">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-amber-800">
          <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            打印預覽 · {rows.length} 頁（一人一張）· 沙盒假連結
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" aria-hidden />
            打印
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" aria-hidden />
            關閉
          </Button>
        </div>
      </div>

      {rows.map((r) => {
        const url = mockPublicLink(r.token)
        const qr = qrByToken[r.token]
        return (
          <article key={r.id} className="cu-print-sheet">
            <p className="cu-slip-brand">明學教育 · MainHope</p>
            <h1 className="cu-slip-title">聯絡資料核對／更新</h1>

            <div className="cu-slip-student">
              <p className="cu-slip-name">{r.full_name}</p>
              <p className="cu-slip-meta">
                學號 {r.student_code}
                {r.grade_label ? ` · ${r.grade_label}` : ""}
                {r.school ? ` · ${r.school}` : ""}
              </p>
            </div>

            <div className="cu-slip-qr-wrap">
              {qr ? (
                <img className="cu-slip-qr" src={qr} alt={`${r.full_name} 更新連結二維碼`} />
              ) : (
                <div
                  className="cu-slip-qr"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    border: "1px dashed #d5dbe8",
                    fontSize: "10pt",
                    color: "#8a93a3",
                  }}
                >
                  產生 QR 中…
                </div>
              )}
              <p className="cu-slip-qr-hint">請用手機相機掃描二維碼開啟專屬更新頁</p>
            </div>

            <section className="cu-slip-guide">
              <h2>更新指引</h2>
              <ol>
                <li>掃描上方二維碼，或於瀏覽器開啟下方連結。</li>
                <li>確認學生姓名與學號無誤（身份資料不可改）。</li>
                <li>核對學生／家長電話；若調亂請直接改正。</li>
                <li>選擇第一聯絡人及偏好通訊方式（WhatsApp／WeChat）。</li>
                <li>提交後由職員審核，核准後才寫入學生檔案。</li>
              </ol>
            </section>

            <div className="cu-slip-link">
              <p className="label">專屬連結（亦可手動輸入）</p>
              <p className="url">{url}</p>
            </div>

            <p className="cu-slip-footer">
              此頁一人一張，方便派發。連結僅供該生使用；如有疑問請向職員查詢。
            </p>
          </article>
        )
      })}
    </div>
  )
}
