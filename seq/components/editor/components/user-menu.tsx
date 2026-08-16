"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserRound, LayoutDashboard, ExternalLink, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/seq/components/ui/avatar"
import * as Popover from "@radix-ui/react-popover"
import { authClient } from "@/lib/auth/client"

interface UserMenuProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const sessionUser = session?.user

  const defaultUser = {
    name: user?.name || sessionUser?.name || sessionUser?.email || "Guest",
    email: user?.email || sessionUser?.email || "Sign in to access",
    avatar:
      user?.avatar ||
      sessionUser?.image ||
      `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
        sessionUser?.email || user?.email || "guest",
      )}`,
  }

  const [open, setOpen] = React.useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative p-2">
          <Avatar className="size-8">
            <AvatarImage src={defaultUser.avatar || "/avatars/avatar-01.svg"} alt={defaultUser.name} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 via-purple-500 to-blue-500 text-white text-xs font-semibold">
              {defaultUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Popover.Trigger asChild>
            <button className="absolute inset-0 cursor-pointer outline-none" aria-label="Open user menu" />
          </Popover.Trigger>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="start"
          side="bottom"
          sideOffset={-48}
          alignOffset={0}
          className="w-[300px] bg-neutral-900/95 backdrop-blur-xl border border-[var(--border-default)] rounded-2xl shadow-2xl z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 outline-none"
        >
          <div className="flex items-center gap-3 p-2">
            <Avatar className="size-8">
              <AvatarImage src={defaultUser.avatar || "/avatars/avatar-01.svg"} alt={defaultUser.name} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 via-purple-500 to-blue-500 text-white text-xs font-semibold">
                {defaultUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{defaultUser.name}</p>
              <p className="text-neutral-400 text-xs truncate">{defaultUser.email}</p>
            </div>
          </div>

          <div className="h-px bg-[var(--border-default)] mx-3 my-1" />

          <div className="px-2 py-2">
            <MenuLink icon={<UserRound className="size-4" />} href="/account">
              Account
            </MenuLink>
            <MenuLink icon={<LayoutDashboard className="size-4" />} href="/workspace">
              Workspace
            </MenuLink>
            <MenuLink icon={<ExternalLink className="size-4" />} href="/support">
              Support
            </MenuLink>
          </div>

          <div className="flex items-center justify-center gap-4 px-3 py-3 border-t border-[var(--border-default)]">
            <MenuLink className="text-xs" href="/terms">
              Terms
            </MenuLink>
            <MenuLink className="text-xs" href="/privacy">
              Privacy
            </MenuLink>
            {sessionUser ? (
              <MenuButton className="text-xs" onClick={handleSignOut}>
                <LogOut className="size-3" />
                Sign out
              </MenuButton>
            ) : (
              <MenuLink className="text-xs" href="/login">
                Sign in
              </MenuLink>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function MenuLink({
  icon,
  children,
  href,
  className,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  href: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg transition-colors outline-none w-full ${className ?? ""}`}
    >
      {icon}
      <span className="text-sm">{children}</span>
    </Link>
  )
}

function MenuButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg transition-colors outline-none w-full ${className ?? ""}`}
    >
      <span className="text-sm">{children}</span>
    </button>
  )
}
