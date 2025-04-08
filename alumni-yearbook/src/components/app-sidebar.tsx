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

interface SectionStruct {
  email: string;
  cloudinaryId: string;
  cloudinaryUrl: string;
  headtitle: string;
}

interface AppSidebarProps {
  children: React.ReactNode;
  onNavChange: (content: string, url?: string) => void;
  activeContent: string;
}

export function AppSidebar({ children, onNavChange, activeContent }: AppSidebarProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dynamicSections, setDynamicSections] = useState<{ title: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSections() {
      try {
        const response = await fetch(`/api/section/get/`); 
        if (!response.ok) throw new Error("Failed to fetch sections");
        const data: SectionStruct[] = await response.json();

        const sections = data.map((section) => ({
          title: section.headtitle,
          url: section.cloudinaryUrl,
        }));

        setDynamicSections(sections);
      } catch (error) {
        console.error("Error fetching sections:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSections();
  }, []);

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

  const handleLogout = () => {
    router.push("/")
  }

  const navItems = [
    { id: "feed", label: "Feed", icon: Book },
    { 
      id: "yearbook", 
      label: "Your Yearbook", 
      icon: User,
      dropdown: true,
      items: [
        { id: "yearbook", label: "Yearbook", icon: Book, url: "/YEARBOOK_BATCH_2024.pdf" },
        ...dynamicSections.map(section => ({ 
          id: `section-${section.title}`, 
          label: section.title, 
          icon: Book,
          url: section.url
        }))
      ]
    },
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
    { id: "contact_us", label: "Contact Us", icon: Mail },
  ]

  const handleNavItemClick = (id: string, url?: string) => {
    // For yearbook items, pass both the ID and URL to onNavChange
    if (id === "yearbook" || id.startsWith("section-")) {
      onNavChange(id, url);
    } 
    // For non-yearbook items, just pass the ID
    else {
      onNavChange(id);
    }
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover opacity-5"></div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">One Last Dance: Yearbook</h1>
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

      {/* Mobile Menu - with scrolling fix */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-16 px-4 overflow-y-auto mobile-menu-container">
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
                          onClick={() => handleNavItemClick(subItem.id, 'url' in subItem ? subItem.url : undefined)}
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

      {/* Desktop Layout */}
      <div className="flex h-screen pt-16 md:pt-0 relative z-10">
        <SidebarProvider>
          <Sidebar className="hidden md:flex border-r border-blue-100 bg-white shadow-sm">
            <SidebarHeader className="p-4 border-b border-blue-100">
              <h1 className="text-xl font-bold text-blue-600">One Last Dance</h1>
              <p className="text-sm text-gray-500">Class of 2025 Yearbook</p>
            </SidebarHeader>
            <SidebarContent className="py-4">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse">Loading sections...</div>
                </div>
              ) : (
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
                                  onClick={() => handleNavItemClick(subItem.id, 'url' in subItem ? subItem.url : undefined)}
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
              )}
            </SidebarContent>
            <SidebarFooter className="mt-auto p-4 border-t border-blue-100">
              <Button variant="ghost" className="w-full justify-start text-gray-500" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarProvider>
      </div>
    </div>
  )
}
