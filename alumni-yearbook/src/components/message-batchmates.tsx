"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast as sonnerToast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Send, Search, ArrowLeft, MessageSquare, Loader2, ChevronUp } from "lucide-react"
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
  profilePicture?: string
  additionalInfo?: {
    jeevanKaFunda: string
    iitjIs: string
    crazyMoment: string
    lifeTitle: string
  }
}

type Message = {
  email_sender: string
  email_receiver: string
  message: string
  timestamp: Date
}

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #b0b0b0;
    border-radius: 10px;
    border: 2px solid #f1f1f1;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
  
  .scroll-to-top {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 50;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .scroll-to-top.visible {
    opacity: 1;
    visibility: visible;
  }
`;

export default function MessageBatchmates() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showUserList, setShowUserList] = useState(true)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Responsive
  useEffect(() => {
    const checkMobileView = () => setIsMobileView(window.innerWidth < 768)
    checkMobileView()
    window.addEventListener("resize", checkMobileView)
    return () => window.removeEventListener("resize", checkMobileView)
  }, [])

  // Fetch all users basic info on mount
  useEffect(() => {
    if (!session) return
    setIsLoading(true)

    // Add sort parameter to API request
    fetch(`/api/users?limit=10000&sort=name`)
      .then(res => res.json())
      .then(data => {
        let baseUsers: User[] = data.users.filter((u: User) => u.email !== session.user?.email)
        
        // Set users with placeholders (already sorted from API)
        setUsers(
          baseUsers.map(user => ({
            ...user,
            profilePicture: "/placeholder.jpg?height=200&width=200",
            additionalInfo: undefined,
          }))
        )
        setIsLoading(false)

        // Progressive enhancement: fetch details in batches using the batch endpoint
        // but maintain alphabetical order when updating
        const batchSize = 20
        const fetchDetails = async () => {
          for (let i = 0; i < baseUsers.length; i += batchSize) {
            const batch = baseUsers.slice(i, i + batchSize)
            try {
              const res = await fetch("/api/users/batch-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emails: batch.map(u => u.email) }),
              })
              const { users: details } = await res.json()
              
              // Update users while preserving order
              setUsers(prev => {
                const updated = [...prev]
                details.forEach((detail: User) => {
                  const index = updated.findIndex(u => u.email === detail.email)
                  if (index !== -1) {
                    updated[index] = {
                      ...updated[index],
                      profilePicture: detail.profilePicture,
                      additionalInfo: detail.additionalInfo
                    }
                  }
                })
                return updated
              })
            } catch (error) {
              console.error("Error fetching batch details:", error)
            }
            
            // Add a small delay between batches to prevent UI freezing
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }
        
        fetchDetails()
      })
      .catch(err => {
        console.error("Error fetching users:", err)
        sonnerToast.error("Failed to load users")
        setIsLoading(false)
      })
  }, [session])

  // Search/filter users client-side
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users) // Already sorted from the API
    } else {
      const term = searchTerm.toLowerCase()
      // Filter while maintaining alphabetical order (no need to sort again)
      setFilteredUsers(
        users.filter(
          u => u.name.toLowerCase().includes(term) || 
               u.email.toLowerCase().includes(term)
        )
      )
    }
  }, [users, searchTerm])

  // Messaging logic
  useEffect(() => {
    if (!selectedUser || !session) return
    fetch("/api/messages/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: session.user?.email,
        receiver: selectedUser.email,
      }),
    })
      .then(res => res.json())
      .then(data => setMessages(data.messages))
      .catch(() => {})
  }, [selectedUser, session])

  // Add the scrollbar styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = scrollbarStyles;
    document.head.appendChild(styleElement);

    // Setup scroll listener for the scroll-to-top button
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.head.removeChild(styleElement);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Add this function to handle scrolling to top
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message || !selectedUser || !session?.user?.email) {
      sonnerToast.error("Please select a user and type a message")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/messageb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_sender: session.user.email,
          email_receiver: selectedUser.email,
          message,
        }),
      })
      if (response.ok) {
        const newMessage = await response.json()
        setMessages(prevMessages => [...prevMessages, newMessage])
        sonnerToast.success("Message sent successfully")
        setMessage("")
      } else {
        sonnerToast.error("Failed to send message")
      }
    } catch {
      sonnerToast.error("Failed to send message")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setIsMessageDialogOpen(true)
    if (isMobileView) setShowUserList(false)
  }

  const handleBackToUserList = () => {
    setShowUserList(true)
    setSelectedUser(null)
  }

  // UserCard memoized for performance, stable key
  const UserCard = React.memo(
    ({ user }: { user: User }) => (
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-square relative overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage
              src={user.profilePicture}
              alt={user.name}
              className="object-cover"
              style={{ transition: "opacity 0.2s" }}
            />
            <AvatarFallback className="w-full h-full text-4xl">
              {user.name
                .split(" ")
                .map(n => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">{user.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          {user.additionalInfo && (
            <div className="mt-3 text-sm space-y-2 bg-gray-50 p-3 rounded-md">
              {user.additionalInfo.lifeTitle && (
                <div>
                  <span className="font-semibold">Life Title:</span> {user.additionalInfo.lifeTitle}
                </div>
              )}
              {user.additionalInfo.jeevanKaFunda && (
                <div>
                  <span className="font-semibold">Jeevan Ka Funda:</span> {user.additionalInfo.jeevanKaFunda}
                </div>
              )}
              {user.additionalInfo.iitjIs && (
                <div>
                  <span className="font-semibold">IITJ Is:</span> {user.additionalInfo.iitjIs}
                </div>
              )}
              {user.additionalInfo.crazyMoment && (
                <div>
                  <span className="font-semibold">Crazy Moment:</span> {user.additionalInfo.crazyMoment}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => handleUserSelect(user)}
          >
            <MessageSquare size={16} />
            Message
          </Button>
        </CardFooter>
      </Card>
    ),
    (prev, next) => prev.user.email === next.user.email && prev.user.profilePicture === next.user.profilePicture
  )

  const renderUserCards = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        </div>
      )
    }
    if (filteredUsers.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {filteredUsers.map(user => (
          <UserCard key={user.email} user={user} />
        ))}
      </div>
    )
  }

  // Mobile and desktop render logic unchanged
  if (isMobileView) {
    return (
      <div className="relative min-h-screen">
        <div className="relative z-10 flex flex-col h-full w-full">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 pt-4">A Final Adieu</h2>
          {showUserList ? (
            <div 
              className="flex-grow overflow-y-auto w-full custom-scrollbar" 
              ref={scrollContainerRef}
            >
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
                      .map(n => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <div className="font-semibold truncate">{selectedUser?.name}</div>
                  <div className="text-sm text-gray-500 truncate">{selectedUser?.email}</div>
                </div>
              </header>
              <div className="flex-grow overflow-y-auto p-4 space-y-2 w-full">
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
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
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No messages yet</p>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-4 border-t bg-white w-full">
                <div className="flex items-center w-full">
                  <textarea
                    placeholder="Write a heartfelt message for your classmate's yearbook..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="border border-gray-300 rounded-md p-3 w-full min-h-[120px] bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !message}
                    className="flex items-center justify-center ml-2"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </form>
            </div>
          )}
          <Dialog
            open={isMessageDialogOpen}
            onOpenChange={open => {
              setIsMessageDialogOpen(open)
              if (!open) {
                setMessage("")
                if (isMobileView) {
                  setShowUserList(true)
                  setSelectedUser(null)
                }
              }
            }}
          >
            <DialogContent className="sm:max-w-xl md:max-w-2xl bg-white border border-gray-200 shadow-lg max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-800">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser?.profilePicture} alt={selectedUser?.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedUser?.name
                        ?.split(" ")
                        .map(n => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  Message to {selectedUser?.name}
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  This message will appear in your and their personalised yearbook.
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
                  <textarea
                    placeholder="Write a heartfelt message for your classmate's yearbook..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="border border-gray-300 rounded-md p-3 w-full min-h-[120px] bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !message}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <button
            onClick={scrollToTop}
            className={`scroll-to-top rounded-full p-3 bg-blue-600 text-white shadow-lg ${
              showScrollTop ? 'visible' : ''
            }`}
            aria-label="Scroll to top"
          >
            <ChevronUp size={24} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 flex flex-col h-full">
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
          <div 
            className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-240px)]" 
            ref={scrollContainerRef}
          >
            {renderUserCards()}
          </div>
        </div>
        
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="sm:max-w-xl md:max-w-2xl bg-white border border-gray-200 shadow-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-800">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser?.profilePicture} alt={selectedUser?.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedUser?.name
                      ?.split(" ")
                      .map(n => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                Message to {selectedUser?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                These messages will appear in your and their personalised yearbook.
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
                <textarea
                  placeholder="Write a heartfelt message for your classmate's yearbook..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="border border-gray-300 rounded-md p-3 w-full min-h-[120px] bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <DialogFooter className="flex justify-end space-x-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={isSubmitting || !message}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <button
          onClick={scrollToTop}
          className={`scroll-to-top rounded-full p-3 bg-blue-600 text-white shadow-lg ${
            showScrollTop ? 'visible' : ''
          }`}
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
        <Toaster />
      </div>
    </div>
  )
}
