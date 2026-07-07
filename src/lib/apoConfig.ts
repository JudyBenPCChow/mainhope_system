/** 明學IT狗前端設定（不含 API Key） */
export const APO_SESSION_STORAGE_KEY = "mingxue_it_dog_chat_session_v5"

/** 技術支援 WhatsApp；在 .env 設定 VITE_APO_MS_FAN_WHATSAPP（例如 https://wa.me/85291234567） */
export const APO_SUPPORT_WHATSAPP_URL = (import.meta.env.VITE_APO_MS_FAN_WHATSAPP as string | undefined)?.trim() || ""

/** @deprecated 沿用舊 env 名稱 */
export const APO_MS_FAN_WHATSAPP_URL = APO_SUPPORT_WHATSAPP_URL

export const APO_WELCOME_TEXT =
 "你好，我係明學IT狗。訴求係返工，最鍾意返工——順便幫你查學生上堂、請假、狀態同試堂，或者教你點用系統。請問有咩可以幫到你？"

export const APO_STARTER_SUGGESTIONS = [
 "今日有邊個學生請假？",
 "如何查學生今日上唔上堂？",
 "在讀與活躍狀態有什麼分別？",
 "如何進行點名？",
] as const

export const APO_ASSISTANT_NAME = "明學IT狗"
