import { cn } from "@/lib/utils"

/** Shared focus + transition base for sidebar nav interactive items. */
export const navLinkBase =
 "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[1.00625rem] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"

export const navL1IconClass = "h-5 w-5 shrink-0 opacity-90 transition-opacity group-hover:opacity-100"

export const navL2IconClass =
 "h-4 w-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"

export function navL1Class({ active }: { active: boolean }) {
 return cn(
  navLinkBase,
  "font-medium text-white",
  active && "bg-neutral-700 font-medium text-white shadow-sm ring-1 ring-neutral-500",
  !active && "text-neutral-200 hover:bg-neutral-800 hover:text-white"
 )
}

/** L1 accordion group header — weaker highlight when a child route is active. */
export function navGroupClass({ childActive }: { childActive: boolean }) {
 return cn(
  navLinkBase,
  "w-full justify-between text-left font-medium text-white",
  childActive && "bg-neutral-800 text-white",
  !childActive && "text-neutral-200 hover:bg-neutral-800 hover:text-white",
  childActive && "hover:bg-neutral-700"
 )
}

export function navL2RailClass({ open }: { open: boolean }) {
 return cn(
  "ml-3 space-y-0.5 overflow-hidden border-l-2 border-neutral-600 pl-2.5 transition-all duration-200",
  open ? "max-h-[28rem] py-1 opacity-100" : "max-h-0 py-0 opacity-0"
 )
}

export function navL2Class({ active }: { active: boolean }) {
 return cn(
  navLinkBase,
  "gap-2.5 py-2 pl-3 pr-2 text-[0.934375rem] text-neutral-400",
  active && "bg-neutral-700 font-medium text-white shadow-sm ring-1 ring-neutral-500",
  !active && "hover:translate-x-0.5 hover:bg-neutral-800 hover:text-neutral-100"
 )
}

export function navCollapsedIconClass({ active }: { active: boolean }) {
 return cn(
  navLinkBase,
  "w-10 justify-center px-0 py-2.5 text-neutral-200",
  active && "bg-neutral-700 font-medium text-white shadow-inner ring-1 ring-neutral-500",
  !active && "hover:bg-neutral-800 hover:text-white"
 )
}

/** Compact footer icon buttons (expanded footer row or collapsed footer stack). */
export function navFooterIconClass({ active }: { active: boolean }) {
 return cn(
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
  active
   ? "bg-neutral-700 text-white ring-1 ring-neutral-500"
   : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
 )
}
