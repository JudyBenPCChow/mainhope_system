---
name: agent-db-change-notify
description: >-
  每次 agent 非系統畫面改 production 業務資料後，寫入 mgmt_audit_log 並寄
  【AGENT】修改… 通知到 cfan@mainhope.edu.hk。
  Use when agent 剛用 execute_sql／service role／腳本寫入 production，
  或使用者要求 agent 改庫通知、AGENT 修改通知。
---

# Agent 非畫面改庫通知

與 always-apply 規則 `.cursor/rules/agent-db-change-notify.mdc` 配套。改庫成功後**同一輪**執行，勿留待下一個對話。

## 何時跑

**要：** agent 直接改 production 業務列（非使用者按畫面）。  
**唔要：** 只讀、dry-run、只改程式／migration schema、畫面操作。

多筆相關改動可合併一封；無關的分多封。

## 步驟

1. 寫短標題（主旨用，十多字內，無換行），例如：`馮宇BAFS試堂改正價`、`10/13功輔當值改LiamRainRafael`。
2. 寫明細（書面語）：改了什麼表／對象、改前→改後、相關單號／日期／班別。勿貼密鑰、臨時密碼全文。
3. 執行：

```bash
node scripts/agent-db-change-notify.mjs \
  --summary "<短標題>" \
  --detail "<明細>" \
  --conversation "<可選：對話 id 或簡稱>"
```

長明細可先寫入暫存檔：

```bash
node scripts/agent-db-change-notify.mjs \
  --summary "<短標題>" \
  --detail-file /tmp/agent-db-change-detail.txt
```

4. 確認 stdout JSON：`audit.ok` 與 `mail.ok` 皆真。失敗則告知使用者缺什麼。
5. 對話回覆一句：已通知 `cfan@mainhope.edu.hk`，主旨為何。

## 主旨

```
【AGENT】修改<短標題>
```

腳本會自動加前綴；`--summary` 只填短標題，不要重複寫 `【AGENT】修改`。

## 後備（腳本缺金鑰／service role）

1. **Audit**：MCP `execute_sql`：

```sql
insert into public.mgmt_audit_log (actor_label, role, action, path, detail)
values (
  'agent',
  'alien',
  'agent_db_change',
  '/agent/db-change',
  '<摘要>\n\n<明細>'
)
returning id, created_at;
```

2. **寄信**：MCP `mainhope-mail` `send_email`，或：

```bash
node scripts/mcp/resend-mail-server.mjs --send \
  --to "cfan@mainhope.edu.hk" \
  --subject "【AGENT】修改<短標題>" \
  --text "<正文>"
```

正文建議含：香港時間、摘要、明細、對話來源。發件人固定 `noreply@mainhope.edu.hk`。

## 查舊紀錄

```sql
select created_at, actor_label, action, left(detail, 200)
from public.mgmt_audit_log
where action = 'agent_db_change'
order by created_at desc
limit 50;
```

## 勿做

- 改庫後不跑本通知
- 把畫面操作也寄成 AGENT（避免噪音）
- 主旨改格式、改收件人（固定 cfan）
- 讀出或貼上 `.env.mail`／service role 金鑰
- `--dry-run` 當正式完成
