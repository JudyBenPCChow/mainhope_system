import { Component, type ErrorInfo, type ReactNode } from "react"

import { reportUserFacingError } from "@/lib/mgmtErrorReporting"

type Props = { children: ReactNode }

type State = { hasError: boolean; message: string | null }

export class AppErrorBoundary extends Component<Props, State> {
 state: State = { hasError: false, message: null }

 static getDerivedStateFromError(error: Error): State {
  return { hasError: true, message: error.message }
 }

 componentDidCatch(error: Error, info: ErrorInfo): void {
  reportUserFacingError(error, {
   source: "AppErrorBoundary",
   userMessage: "畫面繪製發生錯誤，請重新整理頁面。若問題持續，已由系統回報。",
   detailFrom: info.componentStack ?? undefined,
  })
 }

 private alertRef: HTMLDivElement | null = null

 componentDidUpdate(_prevProps: Props, prevState: State): void {
  if (this.state.hasError && !prevState.hasError && this.alertRef) {
   this.alertRef.focus()
  }
 }

 render(): ReactNode {
  if (this.state.hasError) {
   return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
     <div
      ref={(el) => {
       this.alertRef = el
      }}
      role="alert"
      tabIndex={-1}
      className="max-w-lg rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
     >
      <p className="font-medium">發生未預期的顯示錯誤</p>
      <p role="alert" className="mt-2 text-destructive/90">{this.state.message ?? "請重新整理頁面。"}</p>
     </div>
     <button
      type="button"
      className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
      onClick={() => window.location.reload()}
     >
      重新整理
     </button>
    </div>
   )
  }
  return this.props.children
 }
}
