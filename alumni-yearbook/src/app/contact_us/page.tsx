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
import emailjs from 'emailjs-com';

export default function ContactUs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userEmail = session?.user?.email || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!message) {
        toast.error("Please enter a message", { description: "Message field is required" });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, email: userEmail }),
        });
    
        if (response.ok) {
            await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_SUPPORT!,
                {
                    from_name: session?.user?.name || "A User",
                    message: message,
                    to_email: "anshmcs@gmail.com"
                },
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
            );
            
            toast.success("Message sent successfully", { 
                description: "Your message has been sent to the support team" 
            });
            
            setMessage('');
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
                    Contact
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Contact Us</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">This message will be sent to the support team. Please provide your message below.</p>
                
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Your Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={userEmail}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed"
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
                    disabled={isSubmitting || !message}
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