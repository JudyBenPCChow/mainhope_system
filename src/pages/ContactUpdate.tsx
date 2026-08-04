import { useParams } from "react-router-dom"

import { ContactUpdatePublicForm } from "@/components/contactUpdate/ContactUpdatePublicForm"

/** 家長連結更新聯絡資料：公開頁，不經側欄 Layout */
export default function ContactUpdate() {
  const { token = "" } = useParams<{ token: string }>()
  return <ContactUpdatePublicForm token={token} />
}
