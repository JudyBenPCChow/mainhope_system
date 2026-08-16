import { LOAD_FAILED_LABEL } from "@/lib/mgmtDashboardAssemble"

export function MgmtGroupLoadError({ message }: { message?: string }) {
 return (
  <div
   role="alert"
   className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
  >
   {message ?? LOAD_FAILED_LABEL}
  </div>
 )
}
