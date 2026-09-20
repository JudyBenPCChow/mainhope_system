import { Checkbox } from "@/components/ui/checkbox"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"
import { TRIAL_INVITE_NEAR_LIMIT } from "@/lib/trialInvitePublicFlow"
import { statusToTagTone } from "@/lib/statusTag"
import {
  catalogScheduleLabel,
  isScheduleParentOpen,
} from "@/components/trialInvite/trialInviteCatalogColumns"
import type { TrialInviteCatalogClassControl } from "@/services/trialInviteQueries"

type Props = {
  cls: TrialInviteCatalogClassControl
  selectedIds: Set<string>
  savingKey: string | null
  busy: boolean
  onToggleSelect: (scheduleId: string) => void
  onToggleSelectAll: () => void
  onToggleOpen: (scheduleId: string, open: boolean) => void
  onBulkOpen: (open: boolean) => void
  onKeepNearest: () => void
}

export function TrialInviteCatalogSchedulePanel({
  cls,
  selectedIds,
  savingKey,
  busy,
  onToggleSelect,
  onToggleSelectAll,
  onToggleOpen,
  onBulkOpen,
  onKeepNearest,
}: Props) {
  const allSelected =
    cls.schedules.length > 0 && cls.schedules.every((s) => selectedIds.has(s.id))
  const someSelected = cls.schedules.some((s) => selectedIds.has(s.id)) && !allSelected
  const classBusy = savingKey === `class-schedules:${cls.id}` || busy
  let windowCount = 0

  return (
    <div className="space-y-2 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            disabled={cls.schedules.length === 0}
            onCheckedChange={() => onToggleSelectAll()}
            aria-label={`全選 ${cls.label} 未來堂次`}
          />
          全選本班堂次
        </label>
        <button
          type="button"
          className="text-xs text-primary hover:underline disabled:text-muted-foreground"
          disabled={classBusy || cls.schedules.length === 0}
          onClick={() => onBulkOpen(true)}
        >
          全部開放
        </button>
        <button
          type="button"
          className="text-xs text-primary hover:underline disabled:text-muted-foreground"
          disabled={classBusy || cls.schedules.length === 0}
          onClick={() => onBulkOpen(false)}
        >
          全部剔除
        </button>
        <button
          type="button"
          className="text-xs text-primary hover:underline disabled:text-muted-foreground"
          disabled={classBusy || cls.schedules.length === 0}
          onClick={() => onKeepNearest()}
        >
          只開放最近 {TRIAL_INVITE_NEAR_LIMIT} 堂
        </button>
      </div>
      {cls.schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">沒有未來堂次可控管。</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {cls.schedules.map((sch) => {
            const openInCatalog = !sch.excluded
            const schBusy = savingKey === `schedule:${sch.id}` || classBusy
            const inWindow =
              isScheduleParentOpen(sch) && windowCount < TRIAL_INVITE_NEAR_LIMIT
            if (inWindow) windowCount += 1
            return (
              <li
                key={sch.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1 text-sm"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Checkbox
                    checked={selectedIds.has(sch.id)}
                    onCheckedChange={() => onToggleSelect(sch.id)}
                    aria-label={`選取 ${catalogScheduleLabel(sch)}`}
                  />
                  <div className="min-w-0">
                    <p className={cn(!openInCatalog && "text-muted-foreground line-through")}>
                      {catalogScheduleLabel(sch)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {inWindow ? (
                        <Tag tone={statusToTagTone("安排")} size="sm">
                          公開頁窗口
                        </Tag>
                      ) : null}
                      {sch.trialCount > 0 ? (
                        <Tag tone={statusToTagTone("待")} size="sm">
                          已有試堂
                        </Tag>
                      ) : null}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={openInCatalog}
                    disabled={schBusy}
                    onCheckedChange={(next) => onToggleOpen(sch.id, next)}
                    aria-label={`${catalogScheduleLabel(sch)}開放試堂`}
                  />
                  <span className={cn(!openInCatalog && "text-muted-foreground")}>開放此堂</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
