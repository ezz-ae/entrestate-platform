"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/seq/lib/utils"
import { Home, ImageIcon, LayoutGrid, Film, Settings, PlusSquare, Layers, SlidersHorizontal, Info, UserRound, LayoutDashboard } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/seq/components/ui/tooltip"
import { LogoIcon } from "@/seq/components/editor/components/icons"

export type SidebarView = "library" | "create" | "settings" | "transitions" | "inspector" | "storyboard"

interface AppSidebarProps {
  activeView?: SidebarView
  isPanelOpen?: boolean
  onViewChange?: (view: SidebarView) => void
  onTogglePanel?: () => void
}

const NAV_ITEMS = [
  { id: "home", href: "/agents", icon: Home, label: "Home", miniLabel: "Home", shortcut: "H" },
  {
    id: "image-playground",
    href: "/image-playground",
    icon: ImageIcon,
    label: "Image Studio",
    miniLabel: "Images",
    shortcut: "I",
  },
  { id: "storyboard", href: "/storyboard", icon: LayoutGrid, label: "Storyboard", miniLabel: "Boards", shortcut: "S" },
  { id: "studio", href: "/timeline", icon: Film, label: "Video Timeline", miniLabel: "Timeline", shortcut: "T" },
] as const

const STUDIO_ITEMS: {
  id: SidebarView
  icon: React.FC<{ className?: string }>
  label: string
  miniLabel: string
  shortcut?: string
}[] = [
  { id: "create", icon: PlusSquare, label: "Create", miniLabel: "Create", shortcut: "1" },
  { id: "library", icon: Layers, label: "Library", miniLabel: "Library", shortcut: "2" },
  { id: "storyboard", icon: LayoutGrid, label: "Storyboard", miniLabel: "Panels", shortcut: "3" },
  { id: "transitions", icon: SlidersHorizontal, label: "Transitions", miniLabel: "Effects", shortcut: "4" },
  { id: "inspector", icon: Info, label: "Inspector", miniLabel: "Details", shortcut: "5" },
  { id: "settings", icon: Settings, label: "Settings", miniLabel: "Config", shortcut: "6" },
]

export function AppSidebar({ activeView, isPanelOpen, onViewChange, onTogglePanel }: AppSidebarProps) {
  const pathname = usePathname()
  const isStudioPage = pathname === "/timeline"

  const getNavItemActive = (href: string) => {
    if (href === "/agents") return pathname === "/agents"
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="fixed left-0 top-[var(--app-header-height)] bottom-0 z-50 flex h-[calc(100vh-var(--app-header-height))] w-[60px] flex-col border-r border-[var(--border-default)] bg-[var(--surface-0)]">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-[var(--border-default)]">
          <Link href="/agents" className="flex items-center justify-center group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-lg transition-all group-hover:shadow-xl">
              <LogoIcon className="h-4 w-4 text-black" />
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="flex flex-col gap-0.5 px-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = getNavItemActive(item.href)
              const Icon = item.icon

              return (
                <li key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 transition-all group",
                          isActive ? "text-white" : "text-[var(--text-tertiary)] hover:text-white",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                            isActive ? "bg-[var(--surface-3)]" : "group-hover:bg-[var(--hover-overlay)]",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium leading-none transition-colors",
                            isActive
                              ? "text-white"
                              : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]",
                          )}
                        >
                          {item.miniLabel}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p>
                        {item.label}
                        {item.shortcut && <span className="ml-2 text-[var(--text-tertiary)]">({item.shortcut})</span>}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              )
            })}
          </ul>

          {/* Studio-specific items */}
          {isStudioPage && onViewChange && onTogglePanel && (
            <>
              <div className="mx-2.5 my-2 h-px bg-[var(--border-default)]" />
              <ul className="flex flex-col gap-0.5 px-1.5">
                {STUDIO_ITEMS.map((item) => {
                  const isActive = activeView === item.id && isPanelOpen
                  const Icon = item.icon

                  return (
                    <li key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              if (activeView === item.id) {
                                onTogglePanel()
                              } else {
                                onViewChange(item.id)
                              }
                            }}
                            className={cn(
                              "flex w-full flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 transition-all group",
                              isActive ? "text-white" : "text-[var(--text-tertiary)] hover:text-white",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                                isActive ? "bg-[var(--surface-3)]" : "group-hover:bg-[var(--hover-overlay)]",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-medium leading-none transition-colors",
                                isActive
                                  ? "text-white"
                                  : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]",
                              )}
                            >
                              {item.miniLabel}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12}>
                          <p className="text-sm">
                            {item.label}
                            {item.shortcut && (
                              <span className="ml-2 text-[var(--text-tertiary)]">({item.shortcut})</span>
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </nav>

        {/* Footer with account shortcuts */}
        <div className="border-t border-[var(--border-default)] p-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/workspace"
              className="flex flex-col items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Workspace
            </Link>
            <Link
              href="/account"
              className="flex flex-col items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-white transition-colors"
            >
              <UserRound className="h-4 w-4" />
              Account
            </Link>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export default AppSidebar
