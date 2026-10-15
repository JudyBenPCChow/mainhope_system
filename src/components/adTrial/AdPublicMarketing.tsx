import { useEffect, useState } from "react"

import {
  AD_CAMPUS_PHOTOS,
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
  AD_PUBLIC_MAP_EMBED_SRC,
  AD_TRANSIT,
  AD_TRIAL_TEACHERS,
  AD_TRUST_BULLETS,
} from "@/lib/adPublicLandingCopy"
import { AD_PUBLIC_CONTACT } from "@/lib/adPublicContact"
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion"

const AD_INTEREST_SLIDES = [
  AD_CAMPUS_PHOTOS.followup,
  AD_CAMPUS_PHOTOS.table,
  AD_CAMPUS_PHOTOS.entrance,
  AD_CAMPUS_PHOTOS.class,
  AD_CAMPUS_PHOTOS.homework,
  AD_CAMPUS_PHOTOS.about,
] as const

export function AdInterestLanding({ onPrimary }: { onPrimary: () => void }) {
  const hero = AD_CAMPUS_PHOTOS.consult
  const sub = AD_CAMPUS_PHOTOS.logoSign
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy hero-enter">
            <p className="eyebrow">粉嶺綠悠軒 · 北區中學補習</p>
            <h1>
              想補習？
              <span className="hero-sub">即時索取最新課程時間！</span>
            </h1>
            <p className="lead">
              留下姓名、電話與年級，本社即按本學年開辦班別，把合適時段發給你。無須即時選班。
            </p>
            <div className="cta">
              <button type="button" className="btn btn-primary" onClick={onPrimary}>
                留下聯絡方式 專人跟進
              </button>
            </div>
          </div>
          <div className="hero-art hero-art-enter">
            <span className="hero-blob" aria-hidden="true" />
            <figure className="ph ph-main">
              <img src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} />
            </figure>
            <figure className="ph ph-sub">
              <img src={sub.src} alt={sub.alt} width={sub.width} height={sub.height} loading="lazy" />
            </figure>
          </div>
        </div>
      </section>

      <section className="band band-cream" id="campus-photos" aria-label="校舍相片">
        <div className="shell" data-reveal>
          <AdInterestCampusCarousel />
        </div>
      </section>

      <section className="band">
        <div className="shell" data-reveal>
          <div className="sec-head">
            <h2>如何開始</h2>
            <p>由留名到試堂，一般三步完成。</p>
          </div>
          <ol className="steps" data-reveal-stagger>
            {AD_HOW_TO_START.map((step, index) => (
              <li key={step.title}>
                <span className="step-n" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band-cream">
        <div className="shell" data-reveal>
          <div className="sec-head">
            <h2>為何選擇明學教育</h2>
          </div>
          <div className="trust-split">
            <ul className="trust" data-reveal-stagger>
              {AD_TRUST_BULLETS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <figure className="trust-photo">
              <img
                src={AD_CAMPUS_PHOTOS.about.src}
                alt={AD_CAMPUS_PHOTOS.about.alt}
                width={AD_CAMPUS_PHOTOS.about.width}
                height={AD_CAMPUS_PHOTOS.about.height}
                loading="lazy"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="shell" data-reveal>
          <div className="sec-head">
            <h2>導師</h2>
            <p>各科實際任教老師以本學年安排為準，歡迎查詢。</p>
          </div>
          <ul className="teachers" data-reveal-stagger>
            {AD_TRIAL_TEACHERS.map((teacher) => (
              <li key={teacher.name}>
                <h3>
                  {teacher.name}
                  <span> · {teacher.role}</span>
                </h3>
                <p>{teacher.point}</p>
              </li>
            ))}
          </ul>
          <p className="teachers-note">另有中文、英文、數學、生物、企會財等其他導師，歡迎查詢。</p>
        </div>
      </section>

      <section className="band">
        <div className="shell" data-reveal>
          <div className="sec-head">
            <h2>常見問題</h2>
          </div>
          <div className="faq" data-reveal-stagger>
            {AD_INTEREST_FAQS.map((item, index) => (
              <HomeworkFaq key={item.q} item={item} startOpen={index === 0} />
            ))}
          </div>
        </div>
      </section>

      <section className="band band-cream">
        <div className="shell" data-reveal>
          <div className="sec-head">
            <h2>上課地點</h2>
          </div>
          <p className="addr">{AD_PUBLIC_CONTACT.addressZh}</p>
          <ul className="transit" data-reveal-stagger>
            {AD_TRANSIT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="map-frame">
            <iframe
              title="明學教育校舍位置"
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

function AdInterestCampusCarousel() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const count = AD_INTEREST_SLIDES.length

  const go = (next: number) => {
    setIndex(((next % count) + count) % count)
  }

  useEffect(() => {
    if (reduced || paused) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [reduced, paused, count])

  return (
    <div
      className="campus-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="校舍相片"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <div
        className="campus-carousel-viewport"
        onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStartX == null) return
          const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX
          setTouchStartX(null)
          if (Math.abs(delta) < 40) return
          go(index + (delta < 0 ? 1 : -1))
        }}
      >
        <div className="campus-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {AD_INTEREST_SLIDES.map((photo, slideIndex) => (
            <figure
                key={photo.src}
                className={[slideIndex === index ? "is-active" : "", photo.src === AD_CAMPUS_PHOTOS.about.src ? "is-portrait" : ""]
                  .filter(Boolean)
                  .join(" ") || undefined}
                aria-hidden={slideIndex !== index}
              >
              <img
                src={photo.src}
                alt={slideIndex === index ? photo.alt : ""}
                width={photo.width}
                height={photo.height}
                loading={slideIndex === 0 ? "eager" : "lazy"}
              />
            </figure>
          ))}
        </div>
      </div>
      <div className="campus-carousel-nav">
        <button type="button" className="campus-carousel-arrow" aria-label="上一張" onClick={() => go(index - 1)}>
          ‹
        </button>
        <div className="campus-carousel-dots">
          {AD_INTEREST_SLIDES.map((photo, slideIndex) => (
            <button
              key={photo.src}
              type="button"
              aria-label={`第 ${slideIndex + 1} 張`}
              aria-current={slideIndex === index}
              onClick={() => go(slideIndex)}
            />
          ))}
        </div>
        <button type="button" className="campus-carousel-arrow" aria-label="下一張" onClick={() => go(index + 1)}>
          ›
        </button>
      </div>
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
        <div className="shell hero-inner hero-enter">
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

      <section className="section" data-reveal>
        <div className="shell">
          <div className="feature-grid" data-reveal-stagger>
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

      <section className="section section-tint" id="fees" data-reveal>
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

      <section className="section" data-reveal>
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

      <section className="section section-tint" data-reveal>
        <div className="shell">
          <div className="section-head">
            <h2>現有學生來自（例子）</h2>
          </div>
          <p className="schools">{AD_HOMEWORK_SCHOOLS}</p>
        </div>
      </section>

      <section className="section" data-reveal>
        <div className="shell">
          <div className="quotes" data-reveal-stagger>
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

      <section className="section section-tint" data-reveal>
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

      <section className="section" data-reveal>
        <div className="shell">
          <div className="section-head">
            <h2>上課地點</h2>
          </div>
          <ul className="transit" data-reveal-stagger>
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
