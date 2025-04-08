"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, Check } from "lucide-react"
import { toast, Toaster } from "sonner"
import emailjs from 'emailjs-com'

export default function ContactForm() {
  const { data: session } = useSession()
  const userEmail = session?.user?.email || ""
  const userName = session?.user?.name || ""
  
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message || !formData.subject) {
      toast.error("Please fill in all fields", { description: "Both subject and message are required" })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: formData.message, 
          subject: formData.subject,
          email: userEmail 
        }),
      })
  
      if (response.ok) {
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_SUPPORT!,
          {
            from_name: userName || "A User",
            message: formData.message,
            subject: formData.subject,
            to_email: "akhildhyani420@gmail.com"
          },
          process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
        )
        
        setIsSuccess(true)
        toast.success("Message sent successfully", { 
          description: "Your message has been sent to the support team" 
        })
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            subject: "",
            message: "",
          })
          setIsSuccess(false)
        }, 3000)
      } else {
        toast.error("Failed to send message", { 
          description: "Server returned an error: " + response.status 
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", { 
        description: "A network error occurred while sending your message" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Toaster />
      <h2 className="text-2xl font-bold text-blue-600 mb-6 pt-4">Contact Us</h2>

      <Card className="border-blue-100 bg-white shadow-sm text-gray-800">
        <CardHeader>
          <CardTitle>Send a Message to the Dev Team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Enter the subject of your message"
                  value={formData.subject}
                  onChange={handleChange}
                  className="bg-gray-100 border-gray-300">
                </Input>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="min-h-[150px] bg-white border-gray-300"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!formData.subject || !formData.message || isSubmitting || isSuccess}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Send className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </span>
            ) : isSuccess ? (
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4" /> Message Sent!
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
