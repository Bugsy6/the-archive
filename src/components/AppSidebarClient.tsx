"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { CollectionWithCount } from "@/lib/types"
import {
  LayoutDashboard,
  Tags,
  Settings,
  ArchiveIcon,
} from "lucide-react"

interface AppSidebarClientProps {
  collections: CollectionWithCount[]
}

export function AppSidebarClient({ collections }: AppSidebarClientProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tags", label: "Tags", icon: Tags },
    { href: "/collections", label: "Collections", icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* App title */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-700">
        <ArchiveIcon className="size-6 text-zinc-300 shrink-0" />
        <span className="text-lg font-semibold text-zinc-100 tracking-tight">The Archive</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}

        {collections.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Collections
              </span>
            </div>
            {collections.map((col) => {
              const href = `/${col.slug}`
              const isActive = pathname === href || pathname.startsWith(`/${col.slug}/`)
              return (
                <Link
                  key={col.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
                  )}
                >
                  <span className="text-base leading-none w-4 text-center shrink-0">
                    {col.icon ?? "📦"}
                  </span>
                  <span className="flex-1 truncate">{col.name}</span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {col._count.items}
                  </span>
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </div>
  )
}
