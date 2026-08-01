# 計糧 UI 沙盒（給 Mark Yu 預覽）

獨立小站：只有計糧 mock 介面（財務／管理層切換）。

- **不連** Supabase  
- **無**登入  
- **假資料**  
- 與正式 `mainhope_system` 後台分開部署  

## 本地

```bash
# 在 repo 根目錄
npm run sandbox:payroll
# → http://127.0.0.1:5188/
```

## 建置

```bash
npm run sandbox:payroll:build
# 產物：sandbox/payroll-ui/dist
```

## 部署 Vercel（不上正式 production 主站）

```bash
npm run sandbox:payroll:deploy
```

會把 `dist` 上傳為獨立預覽專案（預設名稱見 package script）。
