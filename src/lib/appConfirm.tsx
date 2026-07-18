import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useRef,
 useState,
 type PropsWithChildren,
} from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ConfirmTone = "default" | "warning" | "destructive"

export type ConfirmResult = boolean | "alternate"

export type ConfirmInputOptions = {
 label: string
 expected: string
 placeholder?: string
}

export type ConfirmOptions = {
 title: string
 description?: string
 confirmText?: string
 cancelText?: string
 alternateText?: string
 tone?: ConfirmTone
 alternateTone?: ConfirmTone
 dismissOnOverlayClick?: boolean
 /** 需輸入與 expected 完全一致（trim 後）才可按確認 */
 confirmInput?: ConfirmInputOptions
}

type ConfirmState = ConfirmOptions & { open: boolean }

type AppConfirmContextValue = {
 confirmDialog: (options: ConfirmOptions) => Promise<ConfirmResult>
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
 const resolverRef = useRef<((value: ConfirmResult) => void) | null>(null)
 const confirmButtonRef = useRef<HTMLButtonElement | null>(null)
 const inputRef = useRef<HTMLInputElement | null>(null)
 const [state, setState] = useState<ConfirmState | null>(null)
 const [typedValue, setTypedValue] = useState("")

 const close = useCallback((result: ConfirmResult) => {
  setState(null)
  setTypedValue("")
  resolverRef.current?.(result)
  resolverRef.current = null
 }, [])

 const confirmDialog = useCallback((options: ConfirmOptions) => {
  return new Promise<ConfirmResult>((resolve) => {
   resolverRef.current = resolve
   setTypedValue("")
   setState({
    open: true,
    tone: options.tone ?? "default",
    alternateTone: options.alternateTone ?? "destructive",
    confirmText: options.confirmText ?? "確定",
    cancelText: options.cancelText ?? "取消",
    alternateText: options.alternateText,
    dismissOnOverlayClick: options.dismissOnOverlayClick ?? false,
    title: options.title,
    description: options.description,
    confirmInput: options.confirmInput,
   })
  })
 }, [])

 const value = useMemo<AppConfirmContextValue>(() => ({ confirmDialog }), [confirmDialog])

 const expected = state?.confirmInput?.expected.trim() ?? ""
 const inputMatched = !state?.confirmInput || typedValue.trim() === expected
 const canConfirm = inputMatched

 useEffect(() => {
  if (!state?.open) return
  if (state.confirmInput) {
   inputRef.current?.focus()
  } else {
   confirmButtonRef.current?.focus()
  }
 }, [state?.open, state?.confirmInput])

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
       if (state?.confirmInput) {
        inputRef.current?.focus()
       } else {
        confirmButtonRef.current?.focus()
       }
      }}
      onEscapeKeyDown={() => close(false)}
      onInteractOutside={(e) => {
       if (!state?.dismissOnOverlayClick) e.preventDefault()
      }}
      onKeyDown={(e) => {
       if (e.key !== "Enter") return
       if (state?.confirmInput) {
        if (!canConfirm) {
         e.preventDefault()
         return
        }
        e.preventDefault()
        close(true)
       }
      }}
     >
      <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
       {state?.title}
      </DialogPrimitive.Title>
      {state?.description ? (
       <DialogPrimitive.Description className="mt-4 max-w-[40ch] text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-xl lg:text-2xl">
        {state.description}
       </DialogPrimitive.Description>
      ) : null}
      {state?.confirmInput ? (
       <div className="mt-6 space-y-2 sm:mt-8">
        <label htmlFor="app-confirm-input" className="block text-sm font-medium text-foreground sm:text-base">
         {state.confirmInput.label}
        </label>
        <Input
         id="app-confirm-input"
         ref={inputRef}
         value={typedValue}
         onChange={(e) => setTypedValue(e.target.value)}
         placeholder={state.confirmInput.placeholder}
         autoComplete="off"
         className="h-11 rounded-xl text-base sm:h-12"
        />
       </div>
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
       {state?.alternateText ? (
        <Button
         type="button"
         size="lg"
         className={cn(
          "h-11 w-full rounded-2xl px-6 text-base sm:h-14 sm:w-auto sm:min-w-[150px] sm:text-xl",
          toneClass(state.alternateTone ?? "destructive")
         )}
         onClick={() => close("alternate")}
        >
         {state.alternateText}
        </Button>
       ) : null}
       <Button
        ref={confirmButtonRef}
        type="button"
        size="lg"
        disabled={!canConfirm}
        className={cn(
         "h-11 w-full rounded-2xl px-6 text-base sm:h-14 sm:w-auto sm:min-w-[150px] sm:text-xl",
         toneClass(state?.tone ?? "default")
        )}
        onClick={() => {
         if (!canConfirm) return
         close(true)
        }}
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
