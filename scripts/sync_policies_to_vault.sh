#!/bin/bash
# sync_policies_to_vault.sh — 政策鏡像（系統 → vault）
# E4 機制（vault 05-Backlog/vault目錄重構.md §3.7）：政策全文由系統自動鏡像入
# Mainhope_admin/60-政策與流程/系統鏡像/，vault 人手零雙寫。
# 觸發：改 docs/policies/ 或 docs/year/*/ops-guide.md 正文後，同一輪跑本 script。
set -euo pipefail

SYSTEM_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT_60="$HOME/Desktop/Mainhope_admin/60-政策與流程"
MIRROR="$VAULT_60/系統鏡像"
STAMP="$(date '+%Y-%m-%d %H:%M')"
YEAR="2627"   # 現行學年（改學年時更新）

# ── 前置檢查 ──
if [ ! -d "$VAULT_60" ]; then
  echo "❌ vault 唔存在：$VAULT_60" >&2; exit 1
fi
mkdir -p "$MIRROR"

# ── 1. policies 全文（含 _INDEX，保留子夾結構）──
rm -rf "$MIRROR/policies"
mkdir -p "$MIRROR/policies"
while IFS= read -r -d '' f; do
  rel="${f#"$SYSTEM_ROOT/docs/policies/"}"
  dst="$MIRROR/policies/$rel"
  mkdir -p "$(dirname "$dst")"
  cp "$f" "$dst"
done < <(find "$SYSTEM_ROOT/docs/policies" -name "*.md" -print0)

# ── 2. TERMINOLOGY ＋ ops-guide ──
cp "$SYSTEM_ROOT/docs/meta/TERMINOLOGY.md" "$MIRROR/TERMINOLOGY.md"
mkdir -p "$MIRROR/$YEAR"
cp "$SYSTEM_ROOT/docs/year/$YEAR/ops-guide.md" "$MIRROR/$YEAR/ops-guide.md"

# ── 3. 每檔加自動生成 header（標明勿手改）──
for f in "$MIRROR/policies"/*.md "$MIRROR/policies"/*/*.md "$MIRROR/TERMINOLOGY.md" "$MIRROR/$YEAR/ops-guide.md"; do
  [ -f "$f" ] || continue
  rel="${f#"$MIRROR/"}"
  case "$rel" in
    policies/*) src="docs/$rel" ;;
    TERMINOLOGY.md) src="docs/meta/TERMINOLOGY.md" ;;
    *) src="docs/year/$rel" ;;
  esac
  header=$(cat <<EOF
> [!warning] 自動鏡像 — 請勿手改
> 來源：\`mainhope_system/${src}\`（真相以系統為準）
> 同步時間：${STAMP}
> 機制：\`mainhope_system/scripts/sync_policies_to_vault.sh\`（改系統後同一輪重跑）

---
EOF
)
  # 用 tmp 檔避免 header 寫入後再 append 時重複
  tmpf="$f.tmp"
  { echo "$header"; cat "$f"; } > "$tmpf"
  mv "$tmpf" "$f"
done

# ── 4. 重建系統鏡像 README 索引 ──
{
  cat <<EOF
# 系統鏡像（自動生成，請勿手改）

> **真相以 \`mainhope_system\` 為準**。本夾由 \`mainhope_system/scripts/sync_policies_to_vault.sh\` 自動同步（最後同步：${STAMP}）。
> vault 政策筆記只寫決策背景，全文睇呢度。

## 結構

| 內容 | 來源 | 說明 |
|---|---|---|
| \`policies/\` | \`mainhope_system/docs/policies/\` | 政策櫃全文（含 _INDEX，按領域子夾） |
| \`TERMINOLOGY.md\` | \`mainhope_system/docs/meta/TERMINOLOGY.md\` | 用語表 |
| \`$YEAR/ops-guide.md\` | \`mainhope_system/docs/year/$YEAR/ops-guide.md\` | 本學年營運指引（會過期） |

## 領域速覽
EOF
  find "$MIRROR/policies" -name "*.md" ! -name "_INDEX.md" | sed "s|$MIRROR/policies/||" | sort | while read -r rel; do
    title=$(grep -m1 "^# " "$MIRROR/policies/$rel" | sed 's/^# //')
    echo "- \`policies/$rel\` — ${title:-（無標題）}"
  done
} > "$MIRROR/README.md"

# ── 5. 反向更新：vault 政策筆記嘅 系統現況 標記 ──
# 映射：vault 筆記 → 對應系統政策（無映射＝尚未系統化）
map_policy() {
  case "$1" in
    計糧方式.md) echo "staffing/PAYROLL_GUIDE.md" ;;
    試堂與優惠條款.md) echo "enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md" ;;
    明學營運SOP.md) echo "scheduling/CLASSROOMS_OPS.md" ;;
    試堂收費及請假條款-正式版.md) echo "payments/TUITION_TERM_AND_LATE_FEE_POLICY.md" ;;
    *) echo "" ;;
  esac
}
for note in "$VAULT_60"/*.md; do
  [ -f "$note" ] || continue
  bn=$(basename "$note")
  [ "$bn" = "README.md" ] && continue
  sys=$(map_policy "$bn")
  if [ -n "$sys" ]; then
    marker="系統現況: 已系統化（鏡像：${sys}）"
  else
    marker="系統現況: 尚未系統化"
  fi
  # 更新 frontmatter 嘅 系統現況 行（存在則替換，否則喺 status 後插入）
  if grep -q "^系統現況:" "$note"; then
    sed -i '' "s|^系統現況:.*|$marker|" "$note"
  else
    sed -i '' "/^status:/a\\
$marker" "$note"
  fi
done

echo "✔ 政策鏡像完成：$MIRROR"
echo "   policies: $(find "$MIRROR/policies" -name '*.md' | wc -l | tr -d ' ') 檔 + TERMINOLOGY + $YEAR/ops-guide"
