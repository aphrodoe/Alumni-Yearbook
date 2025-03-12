"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  User,
  MessageCircle,
  ArrowUpFromLine,
  Bell,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

interface SectionStruct {
  email: string;
  cloudinaryId: string;
  cloudinaryUrl: string;
  headtitle: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navItems, setNavItems] = React.useState<any[]>([]);

  // Fetch sections from API
  React.useEffect(() => {
    async function fetchSections() {
      try {
        const response = await fetch(`http://localhost:3000/api/section/get/`); 
        if (!response.ok) throw new Error("Failed to fetch sections");
        const data: SectionStruct[] = await response.json();

        // Generate dynamic section items with the cloudinaryUrl as a query parameter
        const dynamicSections = data.map((section) => ({
          title: section.headtitle,
          url: `/yearbook?section=${encodeURIComponent(section.headtitle)}&url=${encodeURIComponent(section.cloudinaryUrl)}`,
        }));

        // Construct the nav items, keeping "Yearbook" first
        const dynamicNavItems = [
          {
            title: "Profile",
            url: "#",
            icon: User,
            isActive: true,
            items: [
              { 
                title: "Yearbook", 
                url: "/yearbook", // URL for the default yearbook without params
              },
              ...dynamicSections, // Dynamically fetched sections with query params
            ],
          },
          {
            title: "Message",
            url: "#",
            icon: MessageCircle,
            items: [
              { title: "Batchmates", url: "/message_batchmate" },
              { title: "Juniors", url: "/message_junior" },
            ],
          },
          {
            title: "New Yearbook Section",
            url: "#",
            icon: ArrowUpFromLine,
            items: [
              { title: "Photos", url: "/photos" },
              { title: "Add Yearbook Quote", url: "/quote" },
            ],
          },
          {
            title: "Contact US",
            url: "/contact_us",
            icon: Bell,
          },
        ];

        setNavItems(dynamicNavItems);
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    }

    fetchSections();
  }, []);

  return (
    <Sidebar collapsible="icon" className="bg-white" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
