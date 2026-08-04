/** 批量活動頁沙盒假資料：不連 DB、不反映真實學生 */

import type { ContactUpdateMockForm } from "./mockData"

export const CAMPAIGN_STATUSES = [
  "未產生",
  "未交",
  "待審核",
  "已核准",
  "過期",
] as const

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export type CampaignContactSnapshot = ContactUpdateMockForm

export type CampaignRow = {
  id: string
  full_name: string
  student_code: string
  grade_label: string
  school: string
  status: CampaignStatus
  /** 假連結；未產生時為 null */
  token: string | null
  link_created_at: string | null
  expires_at: string | null
  submitted_at: string | null
  /** 檔案現況（預填舊值） */
  current: CampaignContactSnapshot
  /** 家長提交草稿；僅待審核有 */
  submitted: CampaignContactSnapshot | null
}

function snap(
  partial: Partial<CampaignContactSnapshot> &
    Pick<
      CampaignContactSnapshot,
      | "student_phone"
      | "parent_phone"
      | "primary_contact_person"
      | "student_preferred_contact_method"
      | "parent_preferred_contact_method"
    >
): CampaignContactSnapshot {
  return {
    student_phone_country_code: partial.student_phone_country_code ?? "+852",
    parent_phone_country_code: partial.parent_phone_country_code ?? "+852",
    student_wechat_id: partial.student_wechat_id ?? "",
    parent_wechat_id: partial.parent_wechat_id ?? "",
    ...partial,
  }
}

/** 模擬電話調亂、偏好不一、各狀態齊全，方便 UX 走查 */
export function createInitialCampaignRows(): CampaignRow[] {
  return [
    {
      id: "r1",
      full_name: "陳小明",
      student_code: "MX250123",
      grade_label: "中三",
      school: "某某中學",
      status: "待審核",
      token: "tok_demo_chen",
      link_created_at: "2026-08-20 10:00",
      expires_at: "2026-09-15",
      submitted_at: "2026-08-22 18:40",
      current: snap({
        student_phone: "91234567",
        parent_phone: "65551234",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WeChat",
        parent_wechat_id: "parent_wx_old",
      }),
      submitted: snap({
        student_phone: "65551234",
        parent_phone: "91234567",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WeChat",
        parent_wechat_id: "parent_wx_new",
      }),
    },
    {
      id: "r2",
      full_name: "李美華",
      student_code: "MX250088",
      grade_label: "中一",
      school: "示範書院",
      status: "未交",
      token: "tok_demo_lee",
      link_created_at: "2026-08-20 10:00",
      expires_at: "2026-09-15",
      submitted_at: null,
      current: snap({
        student_phone: "61223344",
        parent_phone: "91220011",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WhatsApp",
      }),
      submitted: null,
    },
    {
      id: "r3",
      full_name: "王大文",
      student_code: "MX240501",
      grade_label: "中四",
      school: "海旁中學",
      status: "未產生",
      token: null,
      link_created_at: null,
      expires_at: null,
      submitted_at: null,
      current: snap({
        student_phone: "",
        parent_phone: "98887766",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WhatsApp",
      }),
      submitted: null,
    },
    {
      id: "r4",
      full_name: "張曉彤",
      student_code: "MX250201",
      grade_label: "中二",
      school: "山景中學",
      status: "已核准",
      token: "tok_demo_cheung",
      link_created_at: "2026-08-18 09:00",
      expires_at: "2026-09-15",
      submitted_at: "2026-08-19 14:20",
      current: snap({
        student_phone: "67001122",
        parent_phone: "90112233",
        primary_contact_person: "學生",
        student_preferred_contact_method: "WeChat",
        student_wechat_id: "student_xt",
        parent_preferred_contact_method: "WhatsApp",
      }),
      submitted: null,
    },
    {
      id: "r5",
      full_name: "黃志強",
      student_code: "MX230099",
      grade_label: "中五",
      school: "東區中學",
      status: "過期",
      token: "tok_demo_wong",
      link_created_at: "2026-07-01 12:00",
      expires_at: "2026-07-31",
      submitted_at: null,
      current: snap({
        student_phone: "51112233",
        parent_phone: "93334455",
        student_phone_country_code: "+86",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WeChat",
        student_wechat_id: "hzq_wx",
        parent_preferred_contact_method: "WeChat",
        parent_wechat_id: "parent_hzq",
      }),
      submitted: null,
    },
    {
      id: "r6",
      full_name: "林雅婷",
      student_code: "MX250310",
      grade_label: "中三",
      school: "某某中學",
      status: "待審核",
      token: "tok_demo_lam",
      link_created_at: "2026-08-21 11:30",
      expires_at: "2026-09-15",
      submitted_at: "2026-08-23 09:05",
      current: snap({
        student_phone: "64445566",
        parent_phone: "97778899",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WhatsApp",
      }),
      submitted: snap({
        student_phone: "64445566",
        parent_phone: "97778899",
        primary_contact_person: "學生",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WeChat",
        parent_wechat_id: "lam_parent_wx",
      }),
    },
    {
      id: "r7",
      full_name: "周啟明",
      student_code: "MX250077",
      grade_label: "中一",
      school: "灣仔中學",
      status: "未產生",
      token: null,
      link_created_at: null,
      expires_at: null,
      submitted_at: null,
      current: snap({
        student_phone: "62220000",
        parent_phone: "90001111",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WhatsApp",
      }),
      submitted: null,
    },
    {
      id: "r8",
      full_name: "吳嘉欣",
      student_code: "MX240888",
      grade_label: "中四",
      school: "南區中學",
      status: "未交",
      token: "tok_demo_ng",
      link_created_at: "2026-08-20 10:00",
      expires_at: "2026-09-15",
      submitted_at: null,
      current: snap({
        student_phone: "68889900",
        parent_phone: "95556677",
        primary_contact_person: "家長",
        student_preferred_contact_method: "WhatsApp",
        parent_preferred_contact_method: "WhatsApp",
      }),
      submitted: null,
    },
  ]
}

export function mockPublicLink(token: string): string {
  return `https://mgmt.example/ContactUpdate/${token}`
}

export function buildCampaignCsv(rows: CampaignRow[]): string {
  const header = [
    "學號",
    "姓名",
    "年級",
    "狀態",
    "連結",
    "有效至",
    "提交時間",
  ].join(",")
  const lines = rows.map((r) =>
    [
      r.student_code,
      r.full_name,
      r.grade_label,
      r.status,
      r.token ? mockPublicLink(r.token) : "",
      r.expires_at ?? "",
      r.submitted_at ?? "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  )
  return [header, ...lines].join("\n")
}

export type DiffField = {
  key: keyof CampaignContactSnapshot
  label: string
  before: string
  after: string
  changed: boolean
}

const DIFF_LABELS: { key: keyof CampaignContactSnapshot; label: string }[] = [
  { key: "primary_contact_person", label: "第一聯絡人" },
  { key: "student_phone_country_code", label: "學生區號" },
  { key: "student_phone", label: "學生電話" },
  { key: "student_preferred_contact_method", label: "學生偏好通訊" },
  { key: "student_wechat_id", label: "學生 WeChat ID" },
  { key: "parent_phone_country_code", label: "家長區號" },
  { key: "parent_phone", label: "家長電話" },
  { key: "parent_preferred_contact_method", label: "家長偏好通訊" },
  { key: "parent_wechat_id", label: "家長 WeChat ID" },
]

export function buildContactDiff(
  current: CampaignContactSnapshot,
  submitted: CampaignContactSnapshot
): DiffField[] {
  return DIFF_LABELS.map(({ key, label }) => {
    const before = current[key] || "—"
    const after = submitted[key] || "—"
    return { key, label, before, after, changed: before !== after }
  })
}
