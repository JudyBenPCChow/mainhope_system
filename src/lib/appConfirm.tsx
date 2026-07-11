import * as DialogPrimitive from "@radix-ui/react-dialog"
import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ConfirmTone = "default" | "warning" | "destructive"

type ConfirmOptions = {
 title: string
 description?: string
 confirmText?: string
 cancelText?: string
 tone?: ConfirmTone
 dismissOnOverlayClick?: boolean
}

type ConfirmState = ConfirmOptions & { open: boolean }

type AppConfirmContextValue = {
 confirmDialog: (options: ConfirmOptions) => Promise<boolean>
}

const AppConfirmContext = createContext<AppConfirmContextValue | null>(null)

const OVERLAY_Z = "z-[270]"
const CONTENT_Z = "z-[271]"

function toneClass(tone: ConfirmTone): string {
 if (tone === "destructive") return "bg-destructive text-destructive-foreground hover:bg-destructive/90"
 if (tone === "warning") return "bg-warning text-warning-foreground hover:bg-warning/90"
 return "bg-primary text-primary-foreground hover:bg-primary/90"
}

export function AppConfirmProvider({ children }: PropsWithChildren) {
 const resolverRef = useRef<((value: boolean) => void) | null>(null)
 const confirmButtonRef = useRef<HTMLButtonElement | null>(null)
 const [state, setState] = useState<ConfirmState | null>(null)

 const close = useCallback((result: boolean) => {
  setState(null)
  resolverRef.current?.(result)
  resolverRef.current = null
 }, [])

 const confirmDialog = useCallback((options: ConfirmOptions) => {
  return new Promise<boolean>((resolve) => {
   resolverRef.current = resolve
   setState({
    open: true,
    tone: options.tone ?? "default",
    confirmText: options.confirmText ?? "確定",
    cancelText: options.cancelText ?? "取消",
    dismissOnOverlayClick: options.dismissOnOverlayClick ?? false,
    title: options.title,
    description: options.description,
   })
  })
 }, [])

 const value = useMemo<AppConfirmContextValue>(() => ({ confirmDialog }), [confirmDialog])

 return (
  <AppConfirmContext.Provider value={value}>
   {children}
   <DialogPrimitive.Root
    open={Boolean(state?.open)}
    onOpenChange={(open) => {
     if (!open) close(false)
    }}
   >
    <DialogPrimitive.Portal>
     <DialogPrimitive.Overlay className={cn("fixed inset-0 bg-black/35 backdrop-blur-[1px]", OVERLAY_Z)} />
     <DialogPrimitive.Content
      className={cn(
       "fixed left-1/2 top-1/2 w-[min(700px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-neutral-300 bg-background px-7 py-7 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.45)] sm:px-9 sm:py-8",
       CONTENT_Z
      )}
      onOpenAutoFocus={(e) => {
       e.preventDefault()
       confirmButtonRef.current?.focus()
      }}
      onEscapeKeyDown={() => close(false)}
      onInteractOutside={(e) => {
       if (!state?.dismissOnOverlayClick) e.preventDefault()
      }}
     >
      <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
       {state?.title}
      </DialogPrimitive.Title>
      {state?.description ? (
       <DialogPrimitive.Description className="mt-4 max-w-[32ch] text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-xl lg:text-2xl">
        {state.description}
       </DialogPrimitive.Description>
      ) : null}
      <div className="mt-8 flex flex-col-reverse gap-2 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
       <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full rounded-2xl border-neutral-400 px-6 text-base text-primary hover:bg-muted sm:h-14 sm:w-auto sm:min-w-[150px] sm:text-xl"
        onClick={() => close(false)}
       >
        {state?.cancelText ?? "取消"}
       </Button>
       <Button
        ref={confirmButtonRef}
        type="button"
        size="lg"
        className={cn(
         "h-11 w-full rounded-2xl px-6 text-base sm:h-14 sm:w-auto sm:min-w-[150px] sm:text-xl",
         toneClass(state?.tone ?? "default")
        )}
        onClick={() => close(true)}
       >
        {state?.confirmText ?? "確定"}
       </Button>
      </div>
     </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
   </DialogPrimitive.Root>
  </AppConfirmContext.Provider>
 )
}

export function useAppConfirm() {
 const ctx = useContext(AppConfirmContext)
 if (!ctx) throw new Error("useAppConfirm 必須在 AppConfirmProvider 內使用")
 return ctx
}
