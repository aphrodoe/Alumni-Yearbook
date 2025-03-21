'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { toast } from "sonner";
import axios from "axios";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type User = {
  email: string;
  name: string;
};

interface ImageType {
  _id: string;
  cloudinaryUrl: string;
  caption?: string;
  description?: string;
}

export default function PhotosDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMessagesPDF, setIsGeneratingMessagesPDF] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/error");
    }
    if (status === "authenticated") {
      fetchImages();
    }
  }, [status, router]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/images/get/');
      const data = await response.json();
      if (response.ok) {
        setImages(data.images || []);
      } else {
        toast("Error", { description: data.message || "Failed to load images" });
      }
    } catch (error) {
      toast("Error", { description: "Failed to fetch images" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    setSelectedImages(fileArray);
    setPreviewUrls(fileArray.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedImages.length === 0) {
      toast("Missing Information", { description: "Please select images and add details" });
      return;
    }

    setIsUploading(true);
    
    try {
      const imagePromises = selectedImages.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result as string);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images, description, caption }),
      });

      const data = await response.json();

      if (response.ok) {
        toast("Success", { description: "Images uploaded successfully!" });
        setSelectedImages([]);
        setPreviewUrls([]);
        setDescription('');
        setCaption('');
        fetchImages();
      } else {
        toast("Upload Failed", { description: data.message || "Failed to upload images" });
      }
    } catch (error) {
      toast("Error", { description: "An error occurred while uploading images." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      // Fetch image data
      const imageResponse = await fetch("/api/images/get");
  
      const sectionResponse = await fetch("/api/section/get");
  
      if (!imageResponse.ok || !sectionResponse.ok) {
        toast("Error", { description: "Failed to fetch data for PDF generation." });
        return;
      }
  
      const images = await imageResponse.json();
      const sections = await sectionResponse.json();
  
      // Send data to the PDF generation route
      const response = await fetch('/api/pdf', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          images,
          sections,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        toast("Success", { description: "PDF generated successfully!" });
      } else {
        toast("Error", { description: data.message || "Failed to generate PDF" });
      }
    } catch (error) {
      toast("Error", { description: "An error occurred while generating the PDF." });
    }
  };
  
  const handleGenerateMessages = async () => {
    setIsGeneratingMessagesPDF(true);
    try {
      const messagesResponse = await axios.get('/api/messages/fetchall', {
        params: {
          receiver: session?.user?.email
        }
      });
  
      if (!messagesResponse.data.messages || messagesResponse.data.messages.length === 0) {
        toast("No Messages", { description: "No messages found to generate PDF" });
        setIsGeneratingMessagesPDF(false);
        return;
      }
  
      const messagesBySender: { [key: string]: any[] } = {};
      for (const message of messagesResponse.data.messages) {
        if (!messagesBySender[message.email_sender]) {
          messagesBySender[message.email_sender] = [];
        }
        messagesBySender[message.email_sender].push(message);
      }
  
      const senderEmails = Object.keys(messagesBySender);
      const senderNames: { [key: string]: string } = {};
      
      for (const email of senderEmails) {
        const nameResponse = await axios.get('/api/users/getname', {
          params: { email }
        });
        senderNames[email] = nameResponse.data.name?.name || 'Unknown User';
      }
  
      const messageData = [];
      
      for (const [email, messages] of Object.entries(messagesBySender)) {
        messageData.push({
          senderName: senderNames[email],
          senderEmail: email,
          messages: messages.map(msg => ({
            text: msg.message,
            timestamp: msg.timestamp
          }))
        });
      }
  
      const response = await axios.post('/api/pdf/messages', {
        messages: messageData
      });
      
      if (response.status === 200) {
        toast("Success", { 
          description: "Messages PDF generated successfully!", 
          action: {
            label: "View PDF",
            onClick: () => window.open(response.data.url, '_blank')
          }
        });
      } else {
        toast("Error", { description: "Failed to generate messages PDF" });
      }
    } catch (error) {
      console.error('Error generating message PDF:', error);
      toast("Error", { description: "Failed to generate PDF from messages" });
    } finally {
      setIsGeneratingMessagesPDF(false);
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Yearbook</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Photos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Yearbook Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Add a title..."
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <Textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                  />
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {previewUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  )}

                  {/* Upload & Generate PDF Buttons */}
                  <div className="flex gap-4">
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload Photos"}
                    </Button>
                    <Button
                      onClick={handleGeneratePDF}
                    >
                      Generate PDF
                    </Button>
                    <Button
                      onClick={handleGenerateMessages}
                      disabled={isGeneratingMessagesPDF}
                    >
                      {isGeneratingMessagesPDF ? "Generating..." : "Generate PDF for messages"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}