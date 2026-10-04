/**
 * 廣告公開頁說服層文案。
 * 價格對齊 mainhope_meta_catalog_2627.csv。
 * 新頁用書面語：自稱「本社」，班型寫「專科班」。
 */

export const AD_PUBLIC_MAP_EMBED_SRC =
  "https://maps.google.com/maps?q=%E7%B2%89%E5%B6%BA%E7%B6%A0%E6%82%A0%E8%BB%92%E5%95%86%E5%A0%B4&hl=zh-TW&z=16&output=embed"

export const AD_TRIAL_HALF_PRICE = "試堂第一堂半價：初中 $137.5、高中 $150"

export const AD_GROUP_FEE_LINES = [
  "初中專科班（中一至中三）HKD$1,100／4 堂（單堂 $275）",
  "高中專科班（中四至中六）HKD$1,200／4 堂（單堂 $300）",
] as const

/** 查詢頁學費卡（與 AD_GROUP_FEE_LINES 同價）。 */
export const AD_GROUP_FEE_CARDS = [
  { grade: "初中專科班（中一至中三）", amount: "1,100", unit: "／4 堂（單堂 $275）" },
  { grade: "高中專科班（中四至中六）", amount: "1,200", unit: "／4 堂（單堂 $300）" },
] as const

export const AD_GROUP_FEE_PERIOD_NOTE = "每期 4 堂、每週 1 堂，每堂約 75 分鐘。"

export const AD_TRUST_BULLETS = [
  "粉嶺綠悠軒實體校舍，鄰近聯和墟，地點方便",
  "北區地區型教學，溝通更直接",
  "小班安排，較易跟進學生進度",
  "專科專級專教",
  "重視家長溝通與學習跟進",
] as const

export const AD_PARENT_QUOTES = [
  "課堂安排清晰，跟進亦很細緻，家長比較容易了解小朋友的學習情況。",
  "地點方便，課堂節奏穩定，小朋友較容易慢慢建立信心。",
] as const

export const AD_HOW_TO_START = [
  { title: "WhatsApp 或填表", body: "告訴本社學生年級與想讀科目。" },
  { title: "了解班別與空缺", body: "本社會按本學年安排，建議合適時段。" },
  { title: "預約試堂／報讀", body: "適合的話可先試堂，再決定正式報讀。" },
] as const

export const AD_TRIAL_TEACHERS = [
  { name: "Ms. Christine Fan", role: "中文科負責人", point: "2014 年 DSE 中文科 5**" },
  {
    name: "Mr. Mark Yu",
    role: "數學科負責人",
    point: "九年教學經驗；教授學生超過 800 人；曾任北區名校理科摘星班及補底班導師",
  },
  { name: "Ms. Gigi Ng", role: "英文科導師", point: "12 年英文補習老師經驗；擅長教授底子較弱的學生" },
  { name: "Ms. Phoebe Tam", role: "化學科導師", point: "2024 年 DSE 化學生物 5*" },
  { name: "Mr. Henry Wong", role: "生物科導師", point: "2025 年 DSE 生物科 5*" },
  { name: "Mr. Leo Chan", role: "物理科導師", point: "2026 年 DSE 數學和物理 5*" },
] as const

export const AD_GROUP_RULES = [
  "本學年專科班約由 2026 年 9 月至 2027 年 6 月，約共 10 期。",
  "每科每期通常 4 堂，一週 1 堂，每堂約 75 分鐘。",
  "每科每期最多請假及補堂 1 次；超出部分一般以筆記或課堂錄影補堂。",
  "臨時缺席而又未主動通知校舍，可能不作補堂。",
  "每科每期可免費調堂 1 次，須於 24 小時前書面通知；超出每次行政費港幣 20 元。",
  "歡迎隨時插班；如無適合時段，可聯絡本社了解其他時間之班別。",
] as const

export const AD_TRANSIT = [
  "專線小巴 52A／55K，於「聯和墟總站」下車",
  "巴士 70K、78K、79K、277X",
  "港鐵粉嶺站 A 出口步行約 25 分鐘",
] as const

export const AD_TRIAL_FAQS = [
  {
    q: "每堂多久？",
    a: "每堂約 75 分鐘。",
  },
  { q: "一班幾人？", a: "小班教學，每班約四人。報讀前可與職員查詢目前就讀人數。" },
  {
    q: "學費如何計算？",
    a: "初中 HKD$1,100／4 堂（單堂 $275）；高中 HKD$1,200／4 堂（單堂 $300）。每期 4 堂、每週 1 堂。",
  },
  { q: "試堂收費是多少？", a: "第一堂半價：初中 $137.5、高中 $150。" },
  { q: "試堂之後一定要報讀？", a: "不需要。試堂只為了解課堂節奏與導師教法是否適合。" },
  { q: "可以隨時插班？", a: "可以。如無適合時段，歡迎聯絡本社了解其他時間之班別。" },
  { q: "請假可以補堂？", a: "每科每期最多請假及補堂 1 次。" },
  { q: "校舍在哪裡？", a: "粉嶺綠悠軒商場 2 樓 11 號鋪（鄰近聯和墟總站）。" },
  { q: "有沒有優惠？", a: "現行優惠可向職員查詢。" },
] as const

export const AD_INTEREST_FAQS = [
  ...AD_TRIAL_FAQS.slice(0, 4),
  {
    q: "是否必須一次報一期四堂？",
    a: "不需要。歡迎隨時插班；學費按堂計算，如本期已開課，只需繳交餘下堂數。",
  },
] as const

const AD_INTEREST_SUBJECT_CORE = ["中文", "英文", "數學"] as const
const AD_INTEREST_SUBJECT_JUNIOR = ["科學", "功課輔導班"] as const
const AD_INTEREST_SUBJECT_SENIOR = ["物理", "化學", "生物", "企會財", "數學延伸", "功課輔導班"] as const

/** 查詢頁剔選科目：固定名單，不讀開班／排程。 */
export function adInterestSubjectsForGrade(grade: string): readonly string[] {
  if (grade === "S1" || grade === "S2" || grade === "S3") {
    return [...AD_INTEREST_SUBJECT_CORE, ...AD_INTEREST_SUBJECT_JUNIOR]
  }
  if (grade === "S4" || grade === "S5" || grade === "S6") {
    return [...AD_INTEREST_SUBJECT_CORE, ...AD_INTEREST_SUBJECT_SENIOR]
  }
  return []
}

export const AD_HOMEWORK_HOURS = "星期一至五下午 3:30 至 7:30"

export const AD_HOMEWORK_HERO = {
  eyebrow: "粉嶺綠悠軒 · 課後支援",
  title: "解決功課默書危機",
  lead: "放學後到校，導師全程陪伴，即場完成當日功課。小學及中學均可發問各科問題，默書、測驗或考試亦可提早溫習。",
  prices: ["小學 $2,500 起（每週三日）", "中學 $2,800 起（每週三日）"] as const,
  hours: AD_HOMEWORK_HOURS,
} as const

export const AD_HOMEWORK_HIGHLIGHTS = [
  {
    title: "導師全程陪伴，功課即場完成",
    body: "在安靜專注的環境下完成當日功課，有問題即時有導師解答。",
  },
  {
    title: "跨科即時支援，小學與中學都可發問",
    body: "小學可處理中文、英文、數學及常識的基礎問題；中學可處理中文、英文、數學及理科。有問題即時問，毋須等到下一堂。",
  },
  {
    title: "默書、測驗及考試，提早溫習",
    body: "導師按學校進度，於默書、測驗或考試前安排溫習。",
  },
  {
    title: "功課完成後，可繼續練習",
    body: "校舍備有各科教科書、參考書及按年級預備的練習，完成功課後可繼續溫習。",
  },
  {
    title: "每日學習紀錄，家長隨時掌握",
    body: "每天課堂後，家長可經專屬連結了解子女當日情況。",
  },
] as const

export const AD_HOMEWORK_DAILY = [
  "學生到達時間、離開時間",
  "今天手冊及完成功課或溫習情況",
  "家長須跟進情況",
] as const

export const AD_HOMEWORK_FEE_NOTE =
  "學費以月費計算，不設按堂扣減。12 月及 2 月課堂日數較少，只收取月費四分三。現行優惠可向職員查詢。"

export const AD_HOMEWORK_FEE_SPLIT = "小學與中學分開報讀，月費見上表。"

export const AD_HOMEWORK_FEE_ROWS = [
  { grade: "中一", three: "2,800", four: "3,100", five: "3,200" },
  { grade: "中二", three: "2,900", four: "3,200", five: "3,300" },
  { grade: "中三", three: "3,000", four: "3,300", five: "3,400" },
  { grade: "小一至小六", three: "2,500", four: "2,700", five: "2,800" },
] as const

export const AD_HOMEWORK_SCHOOLS =
  "中學例子包括風采、陳融、鳳溪、禮賢會、馬錦燦、心誠。小學在讀學生來自神召會小學、曾憲備及粉嶺官立小學。"

export const AD_HOMEWORK_TRANSIT = [
  { title: "專線小巴", body: "粉嶺站 52A／上水站 55K，於「聯和墟總站」下車。" },
  { title: "巴士", body: "70K、78K、79K、277X 等於「聯和墟總站」下車。" },
  { title: "港鐵", body: "粉嶺站 A 出口步行約 25 分鐘；建議轉乘小巴較便捷。" },
] as const

export const AD_HOMEWORK_QUOTES = [
  "當天功課多數可以即場做完。默書或測驗前亦有人帶著溫，回家不用再追。",
  "每天都能看到子女何時到達、完成了甚麼，以及哪裡要跟進。",
] as const

export const AD_HOMEWORK_WHILE_WAITING = [
  "粉嶺綠悠軒實體校舍，鄰近聯和墟，地點方便",
  "小學與中學均可報讀功課輔導班，月費分開列明",
  "每天結束後，家長可經專屬連結了解當日情況",
] as const

export const AD_HOMEWORK_FAQS = [
  {
    q: "功課輔導班適合哪類學生？",
    a: "適合小一至小六，以及中一至中三、需要每天完成功課並建立穩定學習習慣的學生。功輔班按月報讀，重點是完成功課、溫習與跟進。專科班則按科目分班，重點是該科的知識與考試。",
  },
  { q: "可以選擇每週上幾日？", a: "小學及中學均可按每週三日、四日或五日選擇。" },
  {
    q: "家長如何知道當天情況？",
    a: "每天結束後，家長可透過專屬連結了解到達／離開時間、功課或溫習情況，以及須跟進事項。",
  },
  {
    q: "小學和中學是否同一班？",
    a: "小學功課輔導與中學分開報讀。小一至小六月費為三日港幣 2,500 元、四日 2,700 元、五日 2,800 元；中一至中三見月費表。",
  },
  {
    q: "功輔班與專科班有何不同？",
    a: "功輔班按月報讀，重點是完成功課、溫習與學習習慣。專科班按科目分班，重點是該科的知識與考試。",
  },
  { q: "上課時間是甚麼？", a: `小學及中學均為${AD_HOMEWORK_HOURS}。` },
] as const

export const AD_CAMPUS_PHOTOS = {
  class: { src: "/images/ad/campus-class.jpg", alt: "導師於白板前講課", width: 1024, height: 576 },
  homework: { src: "/images/ad/campus-homework.jpg", alt: "學生於課室完成練習", width: 1024, height: 576 },
  followup: { src: "/images/ad/campus-followup.jpg", alt: "導師在課室旁協助學生練習", width: 1024, height: 571 },
  about: { src: "/images/ad/campus-about.jpg", alt: "校舍內「學行修明　明學致遠」字幅", width: 768, height: 1024 },
  table: { src: "/images/ad/campus-table.jpg", alt: "小組數學課", width: 1024, height: 576 },
  students: { src: "/images/ad/campus-students.jpg", alt: "學生專心溫習", width: 1024, height: 576 },
  entrance: { src: "/images/ad/campus-entrance.jpg", alt: "粉嶺綠悠軒校舍門口", width: 1024, height: 576 },
  /** 查詢頁 hero：背影為主，避免可辨認未成年正面 */
  consult: {
    src: "/images/ad/campus-consult.jpg",
    alt: "家長與學生在校舍內向職員查詢",
    width: 1024,
    height: 576,
  },
  logoSign: {
    src: "/images/ad/campus-logo-sign.png",
    alt: "明學教育粉嶺綠悠軒校舍招牌",
    width: 1024,
    height: 576,
  },
} as const

/** 試堂預覽只顯示專科班，最多 6 班。空年級不可查全部。 */
export function takeGroupClassPreview<T extends { class_kind: string }>(classes: readonly T[], limit = 6): T[] {
  return classes.filter((row) => row.class_kind === "group").slice(0, limit)
}
