import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { AdPublicCatalogPreview } from "@/components/adTrial/AdPublicCatalogPreview"
import { Button } from "@/components/ui/button"
import {
  AD_CAMPUS_PHOTOS,
  AD_GROUP_FEE_LINES,
  AD_GROUP_RULES,
  AD_HOMEWORK_DAILY,
  AD_HOMEWORK_FAQS,
  AD_HOMEWORK_FEE_NOTE,
  AD_HOMEWORK_FEE_ROWS,
  AD_HOMEWORK_FEE_SPLIT,
  AD_HOMEWORK_HERO,
  AD_HOMEWORK_HIGHLIGHTS,
  AD_HOMEWORK_QUOTES,
  AD_HOMEWORK_SCHOOLS,
  AD_HOMEWORK_TRANSIT,
  AD_HOW_TO_START,
  AD_INTEREST_FAQS,
  AD_PARENT_QUOTES,
  AD_PUBLIC_MAP_EMBED_SRC,
  AD_TRANSIT,
  AD_TRIAL_FAQS,
  AD_TRIAL_HALF_PRICE,
  AD_TRIAL_TEACHERS,
  AD_TRUST_BULLETS,
} from "@/lib/adPublicLandingCopy"
import { AD_PUBLIC_CONTACT } from "@/lib/adPublicContact"
import type { StudentGradeCode } from "@/lib/studentGrade"

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-foreground">{children}</h2>
}

function TrustList() {
  return (
    <section className="mt-8 space-y-2">
      <SectionTitle>為何選擇明學教育</SectionTitle>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {AD_TRUST_BULLETS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

function HowToStart() {
  return (
    <section className="mt-8 space-y-3">
      <SectionTitle>如何開始</SectionTitle>
      <ol className="space-y-3">
        {AD_HOW_TO_START.map((step, index) => (
          <li key={step.title} className="text-sm">
            <p className="font-medium text-foreground">
              {index + 1}. {step.title}
            </p>
            <p className="text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <section className="mt-8 space-y-2">
      <SectionTitle>常見問題</SectionTitle>
      <div className="space-y-2">
        {items.map((item) => (
          <details key={item.q} className="rounded-lg border border-border bg-card px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-foreground">{item.q}</summary>
            <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function Quotes() {
  return (
    <section className="mt-8 space-y-2">
      <SectionTitle>家長分享</SectionTitle>
      {AD_PARENT_QUOTES.map((quote) => (
        <blockquote key={quote} className="rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed text-muted-foreground">
          「{quote}」
          <footer className="mt-1 text-xs">家長分享</footer>
        </blockquote>
      ))}
    </section>
  )
}

function LocationBlock({ showPhoto }: { showPhoto: boolean }) {
  return (
    <section className="mt-8 space-y-3">
      <SectionTitle>上課地點</SectionTitle>
      <p className="text-sm text-foreground">{AD_PUBLIC_CONTACT.addressZh}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {AD_TRANSIT.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {showPhoto ? (
        <img
          src={AD_CAMPUS_PHOTOS.entrance.src}
          alt={AD_CAMPUS_PHOTOS.entrance.alt}
          width={AD_CAMPUS_PHOTOS.entrance.width}
          height={AD_CAMPUS_PHOTOS.entrance.height}
          loading="lazy"
          className="aspect-video w-full rounded-xl object-cover"
        />
      ) : null}
      <iframe
        title="明學教育校舍位置"
        src={AD_PUBLIC_MAP_EMBED_SRC}
        loading="lazy"
        className="h-60 w-full rounded-xl border border-border"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  )
}

function PhotoStrip() {
  const photos = [AD_CAMPUS_PHOTOS.table, AD_CAMPUS_PHOTOS.students, AD_CAMPUS_PHOTOS.entrance]
  return (
    <div className="mt-8 grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          className="aspect-video w-full rounded-lg object-cover"
        />
      ))}
    </div>
  )
}

export function AdTrialLanding({
  onPrimary,
  onUseGrade,
  interestState,
}: {
  onPrimary: () => void
  onUseGrade: (grade: StudentGradeCode) => void
  interestState?: unknown
}) {
  const hero = AD_CAMPUS_PHOTOS.class
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground">粉嶺綠悠軒 · 北區中學補習</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">先試一堂，再決定</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        中一至中六專科班，每堂約 75 分鐘，師生比例最多約 1:7。預約試堂，先了解導師教法與課堂節奏是否適合。
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">{AD_TRIAL_HALF_PRICE}</p>
      <img
        src={hero.src}
        alt={hero.alt}
        width={hero.width}
        height={hero.height}
        className="mt-4 aspect-video w-full rounded-xl object-cover"
      />
      <div className="mt-4 flex flex-col gap-2">
        <Button type="button" className="w-full" onClick={onPrimary}>
          預約試堂
        </Button>
        <Link
          to="/AdInterest"
          state={interestState}
          className="text-center text-sm text-primary underline underline-offset-2"
        >
          未肯定時間？只留名，本社建議班別
        </Link>
      </div>

      <AdPublicCatalogPreview onUseGrade={onUseGrade} />

      <section className="mt-8 space-y-2">
        <SectionTitle>學費</SectionTitle>
        <ul className="space-y-1 text-sm text-foreground">
          {AD_GROUP_FEE_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">每期 4 堂、每週 1 堂、每堂約 75 分鐘。{AD_TRIAL_HALF_PRICE}。</p>
        <p className="text-sm text-muted-foreground">歡迎隨時插班；如無適合時段，可聯絡本社了解其他時間之班別。</p>
      </section>

      <TrustList />
      <HowToStart />

      <section className="mt-8 space-y-3">
        <SectionTitle>導師</SectionTitle>
        <ul className="space-y-3">
          {AD_TRIAL_TEACHERS.map((teacher) => (
            <li key={teacher.name} className="text-sm">
              <p className="font-medium text-foreground">
                {teacher.name}
                <span className="font-normal text-muted-foreground"> · {teacher.role}</span>
              </p>
              <p className="text-muted-foreground">{teacher.point}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">各科實際任教老師見選班時顯示。</p>
        <p className="text-xs text-muted-foreground">另有中文、英文、數學、生物、企會財等其他導師，歡迎查詢。</p>
      </section>

      <Quotes />
      <PhotoStrip />

      <section className="mt-8 space-y-2">
        <SectionTitle>報讀須知</SectionTitle>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {AD_GROUP_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      <FaqList items={AD_TRIAL_FAQS} />
      <LocationBlock showPhoto />
    </div>
  )
}

export function AdInterestLanding({ onPrimary }: { onPrimary: () => void }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground">粉嶺綠悠軒 · 北區中學補習</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">尚未決定？留下資料即可</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        說明年級與想了解的科目，本社會按本學年開辦班別建議合適時段，再約試堂。
      </p>
      <p className="mt-2 text-sm text-muted-foreground">只需姓名、電話、年級，無須即時選班。</p>
      <Button type="button" className="mt-4 w-full" onClick={onPrimary}>
        只留名
      </Button>

      <section className="mt-8 space-y-1 text-sm text-foreground">
        <SectionTitle>學費</SectionTitle>
        <p>{AD_GROUP_FEE_LINES[0]}</p>
        <p>{AD_GROUP_FEE_LINES[1]}</p>
        <p className="text-muted-foreground">{AD_TRIAL_HALF_PRICE}</p>
      </section>

      <TrustList />
      <HowToStart />
      <FaqList items={AD_INTEREST_FAQS} />
      <LocationBlock showPhoto={false} />

      <p className="mt-8 text-center">
        <Link to="/AdTrial" className="text-sm text-primary underline underline-offset-2">
          已經有心儀時間？直接預約試堂
        </Link>
      </p>
    </div>
  )
}

function HomeworkFaq({
  item,
  startOpen,
}: {
  item: { q: string; a: string }
  startOpen?: boolean
}) {
  return (
    <details
      ref={(node) => {
        if (!startOpen || !node || node.dataset.primed === "1") return
        node.open = true
        node.dataset.primed = "1"
      }}
    >
      <summary>{item.q}</summary>
      <p>{item.a}</p>
    </details>
  )
}

export function AdHomeworkLanding({ onPrimary }: { onPrimary: () => void }) {
  const hero = AD_CAMPUS_PHOTOS.class
  const photos = [AD_CAMPUS_PHOTOS.table, AD_CAMPUS_PHOTOS.students, AD_CAMPUS_PHOTOS.entrance]
  return (
    <>
      <header className="hero">
        <div className="hero-bg" aria-hidden="true">
          <img src={hero.src} alt="" />
        </div>
        <div className="shell hero-inner">
          <p className="eyebrow">{AD_HOMEWORK_HERO.eyebrow}</p>
          <h1>{AD_HOMEWORK_HERO.title}</h1>
          <p className="hero-lead">{AD_HOMEWORK_HERO.lead}</p>
          <div className="hero-prices">
            {AD_HOMEWORK_HERO.prices.map((line) => (
              <p key={line} className="hero-price">
                {line}
              </p>
            ))}
          </div>
          <p className="hero-note">{AD_HOMEWORK_HERO.hours}</p>
          <div className="hero-cta">
            <button type="button" className="btn btn-primary" onClick={onPrimary}>
              立即登記半價試堂
            </button>
            <a className="btn btn-ghost" href="#fees">
              查看月費
            </a>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="shell">
          <div className="feature-grid">
            {AD_HOMEWORK_HIGHLIGHTS.map((item, index) => (
              <article key={item.title} className="feature">
                <h3>
                  <span className="num">{index + 1}</span>
                  {item.title}
                </h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint" id="fees">
        <div className="shell">
          <div className="fee-wrap">
            <table>
              <caption>功輔班月費（港元）</caption>
              <thead>
                <tr>
                  <th scope="col">年級</th>
                  <th scope="col">三日</th>
                  <th scope="col">四日</th>
                  <th scope="col">五日</th>
                </tr>
              </thead>
              <tbody>
                {AD_HOMEWORK_FEE_ROWS.map((row) => (
                  <tr key={row.grade}>
                    <th scope="row">{row.grade}</th>
                    <td>{row.three}</td>
                    <td>{row.four}</td>
                    <td>{row.five}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fee-note">{AD_HOMEWORK_FEE_NOTE}</p>
          <p className="fee-note">{AD_HOMEWORK_FEE_SPLIT}</p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <h2>家長可了解當日情況</h2>
            <p>每天結束後，家長可以透過專屬連結了解學生當天情況：</p>
          </div>
          <div className="daily-layout">
            <ul className="check-list">
              {AD_HOMEWORK_DAILY.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <img
              className="daily-photo"
              src="/images/ad/homework-upload.jpg"
              alt="家長以手機查看已上傳的功課，畫面顯示上傳完成"
              width={1024}
              height={576}
              loading="lazy"
            />
            <figure className="daily-demo">
              <video
                src="/videos/ad-homework-daily.mp4"
                poster="/videos/ad-homework-daily.jpg"
                autoPlay
                muted
                loop
                playsInline
                aria-label="家長專屬連結的每日紀錄示範"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <h2>現有學生來自（例子）</h2>
          </div>
          <p className="schools">{AD_HOMEWORK_SCHOOLS}</p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="quotes">
            {AD_HOMEWORK_QUOTES.map((quote) => (
              <blockquote key={quote}>
                <p>{quote}</p>
                <footer>家長分享</footer>
              </blockquote>
            ))}
          </div>
          <div className="photo-strip">
            {photos.map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <h2>常見問題</h2>
          </div>
          <div className="faq">
            {AD_HOMEWORK_FAQS.map((item, index) => (
              <HomeworkFaq key={item.q} item={item} startOpen={index === 0} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <h2>上課地點</h2>
          </div>
          <ul className="transit">
            {AD_HOMEWORK_TRANSIT.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
          <div className="map-frame">
            <iframe
              title="明學教育上課地點地圖"
              src={AD_PUBLIC_MAP_EMBED_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  )
}
