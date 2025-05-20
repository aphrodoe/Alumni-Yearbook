"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Book,
  Upload,
  MessageSquare,
  Mail,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  Package,
  Users,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { signOut } from "next-auth/react"

import { Great_Vibes } from "next/font/google"
const cursiveFont = Great_Vibes({ subsets: ["latin"], weight: ["400"] })

interface AppSidebarProps {
  children: React.ReactNode;
  onNavChange: (content: string, url?: string) => void;
  activeContent: string;
}

export function AppSidebar({ children, onNavChange, activeContent }: AppSidebarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add effect to handle body overflow when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      
      await signOut({
        redirect: true,
        callbackUrl: '/'
      });
      
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.href = '/';
    }
  };

  const navItems = [
    { id: "about", label: "About", icon: Book },
    { id: "feed", label: "Feed", icon: Package },
    {
      id: "message",
      label: "Message",
      icon: MessageSquare,
      dropdown: true,
      items: [
        { id: "message_batchmate", label: "Batchmates", icon: MessageSquare },
        { id: "message_junior", label: "Juniors", icon: MessageSquare },
      ],
    },
    {
      id: "add",
      label: "Upload memories",
      icon: Upload,
    },
    { id: "view", label: "View Uploaded Memories", icon: Eye },
    { id: "update", label: "Update Details", icon: User },
    { id: "contact_us", label: "Contact Us", icon: Mail },
    {
      id: "team",
      label: "Meet The Team",
      icon: Users,
    },
  ]

  const handleNavItemClick = (id: string) => {
    onNavChange(id);
    setMobileMenuOpen(false);
  }

  return (
    <>
      {/* Mobile Header - now outside the main container */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md pl-4 pr-2 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            <span className={`${cursiveFont.className} text-3xl`}>One Last Dance</span>
            <span className="text-xl">: Yearbook</span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-blue-600"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      
      {/* Mobile view - direct content without container divs */}
      <div className="md:hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover opacity-5"></div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white pt-16 pl-4 pr-2 overflow-y-auto mobile-menu-container">
            <div className="flex flex-col space-y-2 pb-20">
              {navItems.map((item) => {
                if (item.dropdown) {
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center px-4 py-2 text-gray-500">
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      <div className="pl-8 space-y-2">
                        {item.items?.map((subItem) => (
                          <Button
                            key={subItem.id}
                            variant="ghost"
                            className={`w-full justify-start ${activeContent === subItem.id ? "bg-blue-50 text-blue-600" : "text-gray-500"}`}
                            onClick={() => handleNavItemClick(subItem.id)}
                          >
                            <subItem.icon className="mr-2 h-5 w-5" />
                            {subItem.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start ${activeContent === item.id ? "bg-blue-50 text-blue-600" : "text-gray-500"}`}
                    onClick={() => handleNavItemClick(item.id)}
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Button>
                )
              })}

              <Button variant="ghost" className="w-full justify-start text-gray-500 mt-auto" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        )}
        
        <SidebarProvider>
          <main className="flex-1 overflow-auto pt-16 pl-4 pr-2">{children}</main>
        </SidebarProvider>
      </div>

      {/* Desktop view - with container divs */}
      <div className="hidden md:block min-h-screen bg-gray-50 text-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover opacity-5"></div>
        
        <div className="flex h-screen relative z-10">
          <SidebarProvider>
            <Sidebar className="border-r border-blue-100 bg-white shadow-sm">
              <SidebarHeader className="p-4 border-b border-blue-100">
                <h1 className="text-xl font-bold text-blue-600">
                  <span className={`${cursiveFont.className} text-3xl`}>One Last Dance</span>
                </h1>
                <p className="text-sm text-gray-500">Class of 2025 Yearbook</p>
              </SidebarHeader>
              <SidebarContent className="py-4">
                <SidebarMenu>
                  {navItems.map((item) => {
                    if (item.dropdown) {
                      return (
                        <SidebarMenuItem key={item.id}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton className="w-full">
                                <item.icon className="mr-2 h-5 w-5" />
                                <span>{item.label}</span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white border-blue-100">
                              {item.items?.map((subItem) => (
                                <DropdownMenuItem
                                  key={subItem.id}
                                  className="cursor-pointer hover:bg-blue-50"
                                  onClick={() => handleNavItemClick(subItem.id)}
                                >
                                  <subItem.icon className="mr-2 h-4 w-4" />
                                  <span>{subItem.label}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      )
                    }

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => handleNavItemClick(item.id)}
                          isActive={activeContent === item.id}
                          className={activeContent === item.id ? "bg-blue-50 text-blue-600" : ""}
                        >
                          <item.icon className="mr-2 h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="mt-auto p-4 border-t border-blue-100">
                <Button variant="ghost" className="w-full justify-start text-gray-500" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              </SidebarFooter>
            </Sidebar>
            <main className="flex-1 overflow-auto pl-6 pr-4">{children}</main>
          </SidebarProvider>
        </div>
      </div>
    </>
  )
}