# 計糧 UI 預覽截圖（給 Mark Yu）

產生時間：2026-08-01T08:41:20.387Z
來源：本地 mock `/PayrollUiPreview`（**不接真實薪酬資料**）

## 檔案

| 檔案 | 內容 |
| --- | --- |
| 01-finance-workbench.png | 財務工作台：異常待辦、堂數總覽、逐堂明細 |
| 02-finance-submitted.png | 財務提交核實後（唯讀等待） |
| 03-manager-verify.png | 管理層核實台：待核實摘要、同事薪酬表 |
| 04-manager-drilldown.png | 管理層抽查展開堂數明細 |
| 05-finance-mobile.png | 財務 · 手機寬度 |
| 06-manager-mobile.png | 管理層 · 手機寬度 |

## 流程說明（與截圖對應）

1. 財務審閱異常與堂數 → 提交管理層核實  
2. 管理層睇摘要 → 可退回或「核實並結算」  
3. 財務**不能**直接結算；管理層**原則上不改金額**

## 互動版（可選）

若要親自撳頁面：請開臨時預覽連結（本地 tunnel 或帶 `VITE_PAYROLL_UI_PREVIEW=1` 的暫存部署），**無需 git commit／push 到主線**。
