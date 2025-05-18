"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast, Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Check, FileText, MessageSquare } from "lucide-react"
import Image from "next/image"

interface ImageType {
  _id: string;
  s3Url?: string;          
  imageUrl?: string;       
  caption?: string;
  description?: string;
}

interface Message {
  email_sender: string;
  message: string;
  timestamp?: string;
}

interface FormattedMessage {
  formatted_message: string;
}

interface MessageData {
  senderName: string;
  senderEmail: string;
  messages: {
    text: string;
    timestamp: string;
  }[];
}

interface UserMapping {
  email: string;
  name: string;
}

export default function ImageUploader() {
  const { data: session } = useSession()
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isGeneratingMessagesPDF, setIsGeneratingMessagesPDF] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<ImageType[]>([])

  useEffect(() => {
    if (session) {
      fetchImages()
    }
  }, [session])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images/get/')
      const data = await response.json()
      if (!response.ok) {
        toast.error("Error", { description: data.message || "Failed to load images" })
      } else {
        setUploadedImages(data.images || [])
      }
    } catch {
      toast.error("Error", { description: "Failed to fetch images" })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const fileArray = Array.from(files)
    setSelectedImages(fileArray)
    setPreviewUrls(fileArray.map(file => URL.createObjectURL(file)))
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...selectedImages]
    const newUrls = [...previewUrls]
    
    newImages.splice(index, 1)
    newUrls.splice(index, 1)
    
    setSelectedImages(newImages)
    setPreviewUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedImages.length === 0) {
      toast.error("Missing Information", { description: "Please select images and add details" })
      return
    }

    setIsUploading(true)
    
    try {
      const imagePromises = selectedImages.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onloadend = () => resolve(reader.result as string)
        })
      })

      const base64Images = await Promise.all(imagePromises)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images, description, caption }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        toast.success("Success", { description: "Images uploaded successfully!" })
        
        setTimeout(() => {
          setSelectedImages([])
          setPreviewUrls([])
          setDescription('')
          setCaption('')
          setIsSuccess(false)
          fetchImages()
        }, 2000)
      } else {
        toast.error("Upload Failed", { description: data.message || "Failed to upload images" })
      }
    } catch {
      toast.error("Error", { description: "An error occurred while uploading images." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const imageResponse = await fetch("/api/images/get")
      const sectionResponse = await fetch("/api/section/get")
  
      if (!imageResponse.ok || !sectionResponse.ok) {
        toast.error("Error", { description: "Failed to fetch data for PDF generation." })
        return
      }
  
      const images = await imageResponse.json()
      const sections = await sectionResponse.json()
  
      const formattedMessages: FormattedMessage[] = []
  
      if (session && session.user?.email) {
        const email = encodeURIComponent(session.user.email)
        const messageResponse = await fetch(`/api/messages/fetchall?receiver=${email}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
  
        if (messageResponse.ok) {
          const responseData = await messageResponse.json()
          const messages: Message[] = responseData.messages;
  
          const uniqueSenders: string[] = [...new Set(messages.map((msg: { email_sender: string }) => msg.email_sender))]
  
          const userFetchPromises = uniqueSenders.map(async (email: string) => {
            const userResponse = await fetch(`/api/users/getname?email=${email}`)
            const userData = await userResponse.json()
            return { email, name: userData?.name || "Unknown" }
          })
  
          const userMapping = await Promise.all(userFetchPromises)
          const userMap: Record<string, string> = Object.fromEntries(
            userMapping.map((user: UserMapping) => [user.email, user.name])
          )
  
          messages.forEach((msg: Message) => {
            formattedMessages.push({
              formatted_message: `Message: ${msg.message}  From: ${userMap[msg.email_sender] || "Unknown"}`,
            });
          });
        }
      }
  
      const response = await fetch('/api/pdf', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          images,
          sections,
          messages: formattedMessages,
        }),
      })
  
      const data = await response.json()
      if (response.ok) {
        toast.success("Success", { description: "PDF generated successfully!" })
      } else {
        toast.error("Error", { description: data.message || "Failed to generate PDF" })
      }
    } catch (error) {
      console.error("Error during PDF generation:", error)
      toast.error("Error", { description: "An unexpected error occurred." })
    } finally {
      setIsGeneratingPDF(false)
    }
  }
  
  const handleGenerateMessages = async () => {
    setIsGeneratingMessagesPDF(true)
    try {
      const messagesResponse = await fetch('/api/messages/fetchall?' + new URLSearchParams({
        receiver: session?.user?.email || ''
      }))
      
      const messagesData = await messagesResponse.json()
  
      if (!messagesData.messages || messagesData.messages.length === 0) {
        toast.error("No Messages", { description: "No messages found to generate PDF" })
        setIsGeneratingMessagesPDF(false)
        return
      }
  
      const messagesBySender: Record<string, Message[]> = {}
      for (const message of messagesData.messages) {
        if (!messagesBySender[message.email_sender]) {
          messagesBySender[message.email_sender] = []
        }
        messagesBySender[message.email_sender].push(message)
      }
  
      const senderEmails = Object.keys(messagesBySender)
      const senderNames: Record<string, string> = {}
      
      for (const email of senderEmails) {
        const nameResponse = await fetch('/api/users/getname?' + new URLSearchParams({ email }))
        const nameData = await nameResponse.json()
        senderNames[email] = nameData.name?.name || 'Unknown User'
      }
  
      const messageData: MessageData[] = []
      
      for (const [email, messages] of Object.entries(messagesBySender)) {
        messageData.push({
          senderName: senderNames[email],
          senderEmail: email,
          messages: messages.map(msg => ({
            text: msg.message,
            timestamp: msg.timestamp || ''
          }))
        })
      }
  
      const response = await fetch('/api/pdf/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageData })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Success", { 
          description: "Messages PDF generated successfully!",
          action: {
            label: "View PDF",
            onClick: () => window.open(data.url, '_blank')
          }
        })
      } else {
        toast.error("Error", { description: "Failed to generate messages PDF" })
      }
    } catch (error) {
      console.error('Error generating message PDF:', error)
      toast.error("Error", { description: "Failed to generate PDF from messages" })
    } finally {
      setIsGeneratingMessagesPDF(false)
    }
  }

  const getImageUrl = (image: ImageType): string => {
    return image.imageUrl || image.s3Url || '';
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Image Container */}
      <div 
        className="fixed top-0 left-0 w-full h-full z-0"
        style={{
          backgroundImage: "url('/IITJ_background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5
        }}
      />

      {/* Content Container */}
      <div className="relative z-10">
        <div className="max-w-2xl mx-auto">
          <Toaster />
          <h2 className="text-2xl font-bold text-blue-600 mb-6 pt-4">Add Images & Text</h2>

          <Card className="border-blue-100 bg-white shadow-sm text-gray-800">
            <CardHeader>
              <CardTitle>Upload a Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Title</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Add a title for this memory..."
                      className="bg-white border-gray-300"
                    />
                  </div>

                  {previewUrls.length === 0 ? (
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-12 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <p className="text-gray-500 mb-4">Drag and drop images, or click to browse</p>
                      <Input 
                        id="image" 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("image")?.click()}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Select Images
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Selected Images</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group h-32">
                            <div className="relative w-full h-full">
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover rounded-lg border border-gray-200"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2">
                        <Input 
                          id="add-more" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("add-more")?.click()}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Add More Images
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption</Label>
                    <Textarea
                      id="caption"
                      placeholder="Write a caption for your memory..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[100px] bg-white border-gray-300"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)}
                disabled={selectedImages.length === 0 || isUploading || isSuccess}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <Upload className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                  </span>
                ) : isSuccess ? (
                  <span className="flex items-center">
                    <Check className="mr-2 h-4 w-4" /> Uploaded Successfully!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" /> Upload Memory
                  </span>
                )}
              </Button>
              
              {/* <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                {isGeneratingPDF ? "Generating..." : "Generate Yearbook PDF"}
              </Button>
              
              <Button
                onClick={handleGenerateMessages}
                disabled={isGeneratingMessagesPDF}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              ></Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                {isGeneratingMessagesPDF ? "Generating..." : "Generate Messages PDF"}
              </Button> */}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}