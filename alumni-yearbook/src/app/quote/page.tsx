'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, ReactNode, useState } from "react";
import { CardContent, Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { NextResponse } from 'next/server';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const email= session?.user?.email;

  const [quote, setQuote] = useState('');

  const handleSubmit= async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quote, email }),
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        toast.error("Error submitting quote", { description: errorData.error });
        return;
      }
    
      toast.success("Quote submitted successfully");
      setQuote('');
    } catch (error) {
      console.error('Error processing quote:', error);
      toast.error("Failed to submit quote", { description: "Please try again" });
    }

    
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/error");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    New Yearbook Section
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Yearbook quote</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
                <CardHeader>
                    <CardTitle>Add a yearbook quote</CardTitle>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Add a quote to be added at the front page of your yearbook.</p>
                <div className="space-y-2">
                    
                    <Input
                    id="quote" 
                    type="text" 
                    placeholder="Enter quote" 
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    required
                    />
                </div>


                  <Button 
                    type="submit" 
                    disabled={!quote}
                  >
                    Submit
                  </Button>
                </form> 
                </CardContent>
            </Card>
        </div>

      </SidebarInset>
      <Toaster theme="dark"/>
    </SidebarProvider>
  );
}