import * as React from "react"

import { Select } from "@/components/ui/select"
import {
  formatMonthInputLabel,
  groupMonthInputOptions,
  listMonthInputOptions,
  parseMonthKey,
} from "@/lib/monthInput"
import { cn } from "@/lib/utils"

type MonthInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">

export const MonthInput = React.forwardRef<HTMLInputElement, MonthInputProps>(
  (
    {
      className,
      value,
      onChange,
      disabled,
      id,
      name,
      required,
      min,
      max,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const raw = typeof value === "string" ? value : ""
    const selected = parseMonthKey(raw)
    const options = React.useMemo(
      () => listMonthInputOptions({ min, max, value: selected ?? undefined }),
      [min, max, selected]
    )
    const grouped = React.useMemo(() => groupMonthInputOptions(options), [options])

    const emitChange = (next: string) => {
      if (!onChange) return
      onChange({
        target: { value: next, name },
        currentTarget: { value: next, name },
      } as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <div className={cn("min-w-0", className)}>
        <Select
          id={id}
          aria-label={ariaLabel ?? (selected ? formatMonthInputLabel(selected) : "月份")}
          value={selected ?? ""}
          disabled={disabled}
          placeholder="請選擇月份"
          onChange={(event) => emitChange(event.target.value)}
        >
          {!selected ? <option value="">請選擇月份</option> : null}
          {grouped.map((group) => (
            <optgroup key={group.year} label={`${group.year}年`}>
              {group.items.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <input
          ref={inputRef}
          type="hidden"
          name={name}
          value={selected ?? ""}
          required={required}
        />
      </div>
    )
  }
)

MonthInput.displayName = "MonthInput"
