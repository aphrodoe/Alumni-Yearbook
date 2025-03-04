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
import { useEffect, useState } from "react"; 
import { CardContent, Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export default function MessageBatchmate() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!message || !email) {
        toast.error("Please fill in all fields", { description: "Missing some fields" });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/messageb', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, email }),
        });

    
        if (response.ok) {
            const data = await response.json();
            
            toast.success("Message sent successfully", { 
                description: "Your message has been sent to the junior" 
            });
            
            setMessage('');
            setEmail('');
        } else {
            toast.error("Failed to send message", { 
                description: "Server returned an error: " + response.status 
            });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message", { 
            description: "A network error occurred while sending your message" 
        });
    } finally {
        setIsSubmitting(false);
    }
  };

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
                    Message
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Batchmates</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
                <CardHeader>
                    <CardTitle>Message Batchmates</CardTitle>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Sent a message to your batchmate! This message will be visible in their yearbook upon approval.</p>
                <div className="space-y-2">
                    
                  <label htmlFor="email" className="text-sm font-medium">Batchmate Email</label>
                    <Input
                    id="email" 
                    type="email" 
                    placeholder="Enter email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea
                      id="message"
                      placeholder="Leave a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-24"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !message || !email}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
                </CardContent>
            </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}