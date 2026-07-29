/** 沙盒假資料：不連 DB、不反映真實學生 */

export const PHONE_COUNTRY_CODES = ["+852", "+86"] as const
export const PREFERRED_CONTACT_METHODS = ["WhatsApp", "WeChat"] as const
export const PRIMARY_CONTACT_PERSONS = ["學生", "家長"] as const

export type ContactUpdateMockForm = {
  student_phone: string
  student_phone_country_code: (typeof PHONE_COUNTRY_CODES)[number]
  student_preferred_contact_method: (typeof PREFERRED_CONTACT_METHODS)[number]
  student_wechat_id: string
  parent_phone: string
  parent_phone_country_code: (typeof PHONE_COUNTRY_CODES)[number]
  parent_preferred_contact_method: (typeof PREFERRED_CONTACT_METHODS)[number]
  parent_wechat_id: string
  primary_contact_person: (typeof PRIMARY_CONTACT_PERSONS)[number]
}

/** 只讀身份（表單不可改） */
export const MOCK_STUDENT_IDENTITY = {
  full_name: "陳小明",
  student_code: "MX250123",
  grade_label: "中三",
  school: "某某中學",
} as const

/** 模擬電話調亂：家長號寫在學生欄 */
export function createInitialMockForm(): ContactUpdateMockForm {
  return {
    student_phone: "91234567",
    student_phone_country_code: "+852",
    student_preferred_contact_method: "WhatsApp",
    student_wechat_id: "",
    parent_phone: "65551234",
    parent_phone_country_code: "+852",
    parent_preferred_contact_method: "WeChat",
    parent_wechat_id: "parent_wx_demo",
    primary_contact_person: "家長",
  }
}
