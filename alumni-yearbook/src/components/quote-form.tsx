"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { CardContent, Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

export default function QuoteForm() {
  const { data: session } = useSession()
  const email = session?.user?.email
  
  const [quote, setQuote] = useState('')
  const [fetchedQuote, setFetchedQuote] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quote, email }),
      })
    
      if (!response.ok) {
        const errorData = await response.json()
        toast.error("Error submitting quote", { description: errorData.error })
        return
      }
    
      toast.success("Quote submitted successfully")
      setQuote('')
      
      // Refresh the fetched quote after submission
      fetchQuote()
    } catch (error) {
      console.error('Error processing quote:', error)
      toast.error("Failed to submit quote", { description: "Please try again" })
    }
  }

  const fetchQuote = async () => {
    if (!email) return
    
    try {
      const response = await fetch(`/api/quote/get?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      setFetchedQuote(data.quote)
    } catch (error) {
      console.error('Error fetching quote:', error)
    }
  }

  useEffect(() => {
    if (email) {
      fetchQuote()
    }
  }, [email])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Your current quote</CardTitle>
        </CardHeader>
        {fetchedQuote && <CardContent>
          <p className="text-sm text-gray-500 mb-2">{fetchedQuote}</p>
        </CardContent>}
        {!fetchedQuote && <CardContent>
          <p className="text-sm text-gray-500 mb-2">You have not added a yearbook quote yet</p>
        </CardContent>}
      </Card>
      
      <Toaster theme="dark"/>
    </div>
  )
}
