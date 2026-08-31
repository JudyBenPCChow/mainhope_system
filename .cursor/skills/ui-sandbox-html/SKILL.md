---
name: ui-sandbox-html
description: >-
  樣式／UX 沙盒必須係可雙擊的獨立 HTML。Use when the user says 沙盒、sandbox、試樣式、
  試 UI、唔接真實網頁／系統、html 沙盒, or asks to mock a screen before wiring the real app.
---

# 樣式沙盒（獨立 HTML）

用戶講「沙盒」＝**雙擊 HTML 即用**。鐵則見 `.cursor/rules/ui-sandbox-html.mdc`。讀完本 skill 先動手。

## 做咩

1. 新建（或改）`sandbox/<kebab-name>/index.html` 單檔。
2. 跟 [`sandbox/tuition-quote/index.html`](../../sandbox/tuition-quote/index.html)：
   - `lang="zh-Hant"`；Noto Sans TC；內嵌 `<style>`＋假資料；`noindex`
   - 不 `import` 專案 React／services／Supabase
   - 按鈕唔跳正式路由；最多頁內提示「沙盒：不會進入正式頁」
3. 結構／欄位／用詞抽自現有畫面，但資料寫死（約 10 筆就夠）。
4. 回覆只給**檔案路徑**（同可選 `python3 -m http.server --directory sandbox/<名>`）。唔好把 cloud `localhost:5173` 或受保護 Vercel preview 當用戶本機入口。
5. 可選：`public/<名>.html` 副本；`package.json` 加 `sandbox:<名>` script。React `/prototype/…` 只可作第二步對齊 token。

## 唔好

- 第一件只交 `src/prototypes/`＋`App.tsx` 路由
- 要用戶 checkout 指定 branch 先睇到
- 當 Vercel preview 一定開得（可能要登入）
- 內嵌真實 DB／anon key 寫入

計糧 Vite 沙盒（`npm run sandbox:payroll`）係既有例外；用戶未點名就唔套本 skill。
