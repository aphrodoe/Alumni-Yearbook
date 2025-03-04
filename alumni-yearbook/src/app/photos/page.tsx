'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect } from "react";

export default function PhotosDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  interface Image {
    _id: string;
    cloudinaryUrl: string;
    caption: string;
  }

  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/error");
    }
    
    if (status === "authenticated") {
      fetchImages();
    }
  }, [status, router]);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/images');
      const data = await response.json();
      
      if (response.ok) {
        setImages(data.images || []);
      } else {
        toast("Error",{
          description: data.message || "Failed to load images",
        });
      }
    } catch (error) {
      toast( "Error", {
        description: "Failed to fetch images",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const file = files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!image || !caption) {
      toast( "Missing Information", {
        description: "Please select an image and add a caption",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64data,
            caption: caption
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          toast( "Success",{
            description: "Image uploaded successfully!",
          });
          setImage(null);
          setCaption('');
          setPreviewUrl(null);
          
          fetchImages();
        } else {
          toast("Upload Failed",{
            description: data.message || "Failed to upload image",
          });
        }
      };
    } catch (error) {
      toast( "Error",{
        description: (error instanceof Error ? error.message : "An unexpected error occurred"),
      });
    } finally {
      setIsUploading(false);
    }
  };

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
                  <BreadcrumbPage>Photos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Upload Yearbook Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <label htmlFor="picture" className="text-sm font-medium">Upload Image</label>
                    <Input 
                      id="picture" 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  
                  
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="caption" className="text-sm font-medium">Caption</label>
                  <Textarea
                    id="caption"
                    placeholder="Add a caption for this photo..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-24"
                  />
                </div>
                
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? "Uploading..." : "Upload Photo"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold mt-4">Yearbook Photos</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div>Loading images...</div>
            </div>
          ) : images.length > 0 ? (
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              {images.map((image) => (
                <div key={image._id} className="overflow-hidden rounded-xl bg-muted/50">
                  <img 
                    src={image.cloudinaryUrl} 
                    alt={image.caption}
                    className="aspect-video h-full w-full object-cover"
                  />
                  <div className="p-2 text-sm">
                    <p>{image.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-xl bg-muted/50">
              <p className="text-muted-foreground">No photos uploaded yet.</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}