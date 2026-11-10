import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="flex min-h-svh items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
      計糧工作台已停用。出糧改由對話產出工資單。
    </div>
  </StrictMode>
)
