"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function NavUser() {
  const { data: session } = useSession()
  const { isMobile } = useSidebar()
  const [initials, setInitials] = useState("UN")

  useEffect(() => {
    if (session?.user?.name) {
      const nameArray = session.user.name.split(" ")
      let userInitials = ""
      
      if (nameArray.length >= 2) {
        userInitials = `${nameArray[0][0]}${nameArray[nameArray.length - 1][0]}`
      } else if (nameArray.length === 1) {
        userInitials = nameArray[0].substring(0, 2)
      }
      
      setInitials(userInitials.toUpperCase())
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (!session || !session.user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {session.user.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                ) : null}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{session.user.name || "User"}</span>
                <span className="truncate text-xs">{session.user.email || ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {session.user.image ? (
                    <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session.user.name || "User"}</span>
                  <span className="truncate text-xs">{session.user.email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm">
                <LogOut size={16} />
                Log out
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}