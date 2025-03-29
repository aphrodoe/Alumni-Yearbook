"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { CardContent, Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"
import { Send } from "lucide-react"
import emailjs from 'emailjs-com'

export default function MessageJunior() {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!message || !email) {
      toast.error("Please fill in all fields", { description: "Both email and message are required" })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/messagej', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email }),
      })

      if (response.ok) {
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
          {
            from_name: session?.user?.name || "A Senior",
            message: message,
            to_email: email
          },
          process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
        )
        
        toast.success("Message sent successfully", { 
          description: "Your message has been sent to the junior" 
        })
        
        setMessage('')
        setEmail('')
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
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Message Juniors</h2>

      <Card className="border-blue-100 bg-white shadow-sm text-gray-800">
        <CardHeader>
          <CardTitle>Send a Message to a Junior</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              This message will be visible to your junior when they get access to this portal, that is, their graduation year! It will also appear in their yearbook.
            </p>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Junior's Email</label>
              <Input
                id="email" 
                type="email" 
                placeholder="Enter junior's email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Your Message</label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px] bg-white border-gray-300"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !message || !email}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
