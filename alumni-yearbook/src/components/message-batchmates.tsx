"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast as sonnerToast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Send, Search, AlertCircle, ArrowLeft, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

type User = {
  email: string
  name: string
  quote?: string
  profilePicture?: string
}

type Message = {
  email_sender: string
  email_receiver: string
  message: string
  timestamp: Date
}

export default function MessageBatchmates() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canMessage, setCanMessage] = useState(true)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showUserList, setShowUserList] = useState(true)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    checkMobileView()

    window.addEventListener("resize", checkMobileView)

    return () => window.removeEventListener("resize", checkMobileView)
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          
          const enhancedUsers = await Promise.all(
            data.map(async (user: User) => {
              try {
                const prefResponse = await fetch(`/api/users/get-preference?email=${encodeURIComponent(user.email)}`);
                if (prefResponse.ok) {
                  const prefData = await prefResponse.json();
                  return {
                    ...user,
                    quote: prefData.preferences?.quote || "No quote provided",
                    profilePicture: prefData.preferences?.photoUrl || `/placeholder.svg?height=200&width=200`,
                  };
                }
                return {
                  ...user,
                  quote: "No quote provided",
                  profilePicture: `/placeholder.svg?height=200&width=200`,
                };
              } catch (error) {
                console.error(`Error fetching preferences for ${user.email}:`, error);
                return {
                  ...user,
                  quote: "No quote provided",
                  profilePicture: `/placeholder.svg?height=200&width=200`,
                };
              }
            })
          );
          
          const filteredData = enhancedUsers.filter((user: User) => user.email !== session?.user?.email);
          setUsers(filteredData);
          applyFilters(filteredData, searchTerm);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        sonnerToast.error("Failed to fetch users");
      }
    };
  
    if (session) {
      fetchUsers();
    }
  }, [session]);
  

  useEffect(() => {
    const fetchMessagesAndCheckStatus = async () => {
      if (!selectedUser || !session) return

      try {
        const response = await fetch("/api/messages/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: session.user?.email,
            receiver: selectedUser.email,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages)
          setCanMessage(data.canMessage)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
        sonnerToast.error("Failed to fetch messages")
      }
    }

    fetchMessagesAndCheckStatus()
  }, [selectedUser, session])

  const applyFilters = (userList: User[], search: string) => {
    let result = [...userList]

    // Filter by search term
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(result)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    applyFilters(users, term)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!message || !selectedUser || !session?.user?.email) {
      sonnerToast.error("Please select a user and type a message")
      return
    }

    if (!canMessage) {
      sonnerToast.error("You can only send one message to this user")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/messageb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_sender: session.user.email,
          email_receiver: selectedUser.email,
          message,
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()

        setMessages((prevMessages) => [...prevMessages, newMessage])

        setCanMessage(false)

        sonnerToast.success("Message sent successfully")
        setMessage("")
        setIsMessageDialogOpen(false)
      } else {
        sonnerToast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      sonnerToast.error("Failed to send message")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setIsMessageDialogOpen(true)
    if (isMobileView) {
      setShowUserList(false)
    }
  }

  const handleBackToUserList = () => {
    setShowUserList(true)
    setSelectedUser(null)
  }

  const renderUserCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {filteredUsers.map((user) => (
        <Card key={user.email} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-square relative overflow-hidden">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={user.profilePicture} alt={user.name} className="object-cover" />
              <AvatarFallback className="w-full h-full text-4xl">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg truncate">{user.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="mt-2 text-sm italic line-clamp-3">"{user.quote}"</p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleUserSelect(user)}>
              <MessageSquare size={16} />
              Message
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  if (isMobileView) {
    return (
      <div className="flex flex-col h-full w-full">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 pt-4">A Final Adieu</h2>
        {showUserList ? (
          <div className="flex-grow overflow-y-auto w-full">
            <div className="p-4 w-full space-y-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {renderUserCards()}
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <header className="flex items-center p-4 bg-white shadow-sm w-full">
              <Button variant="ghost" size="icon" className="mr-2" onClick={handleBackToUserList}>
                <ArrowLeft size={24} />
              </Button>
              <Avatar className="mr-3">
                <AvatarImage src={selectedUser?.profilePicture} alt={selectedUser?.name} />
                <AvatarFallback>
                  {selectedUser?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <div className="font-semibold truncate">{selectedUser?.name}</div>
                <div className="text-sm text-gray-500 truncate">{selectedUser?.email}</div>
              </div>
            </header>

            <div className="p-4 w-full">
              <Alert className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can message a person once. This message will appear in their personalised yearbook.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2 w-full">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.email_sender === session?.user?.email ? "justify-end" : "justify-start"} w-full`}
                >
                  <div
                    className={`max-w-[70%] p-2 rounded-lg ${
                      msg.email_sender === session?.user?.email ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t bg-white w-full">
              <div className="flex items-center w-full">
                <Input
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow mr-2"
                  disabled={!canMessage}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !message || !canMessage}
                  className="flex items-center justify-center"
                >
                  <Send size={20} />
                </Button>
              </div>
              {!canMessage && (
                <p className="text-sm text-red-500 mt-2">You have already sent a message to this user</p>
              )}
            </form>
          </div>
        )}

        <Dialog 
          open={isMessageDialogOpen} 
          onOpenChange={(open) => {
            setIsMessageDialogOpen(open);
            if (!open) {
              // Reset to user list when dialog is closed
              setShowUserList(true);
              setSelectedUser(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-800">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser?.profilePicture} alt={selectedUser?.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedUser?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                Message to {selectedUser?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                This message will appear in their personalised yearbook. You can only send one message to each person.
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[200px] overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.email_sender === session?.user?.email ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div
                      className={`max-w-[70%] p-2 rounded-lg ${
                        msg.email_sender === session?.user?.email 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No messages yet</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!canMessage}
                  className="border-gray-300 bg-white"
                />

                {!canMessage && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>You have already sent a message to this user</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !message || !canMessage} 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Send Message
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">A Final Adieu</h2>
      <div className="p-4 flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        {renderUserCards()}
      </div>

      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-800">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedUser?.profilePicture} alt={selectedUser?.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {selectedUser?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              Message to {selectedUser?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              This message will appear in their personalised yearbook. You can only send one message to each person.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[200px] overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.email_sender === session?.user?.email ? "justify-end" : "justify-start"} mb-2`}
                >
                  <div
                    className={`max-w-[70%] p-2 rounded-lg ${
                      msg.email_sender === session?.user?.email 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No messages yet</p>
            )}
          </div>



          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!canMessage}
                className="border-gray-300 bg-white"
              />

              {!canMessage && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>You have already sent a message to this user</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || !message || !canMessage} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}