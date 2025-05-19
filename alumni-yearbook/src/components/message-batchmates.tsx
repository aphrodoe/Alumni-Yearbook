"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast as sonnerToast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Send, Search, ArrowLeft, MessageSquare, Loader2, Info } from "lucide-react"
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

const preferenceCache = new Map<string, { photoUrl: string, timestamp: number }>();
const additionalInfoCache = new Map<string, { data: any, timestamp: number }>();

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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const observer = useRef<IntersectionObserver | null>(null)
  
  const lastUserElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchTerm) {
        loadMoreUsers()
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore, searchTerm])

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    checkMobileView()

    window.addEventListener("resize", checkMobileView)

    return () => window.removeEventListener("resize", checkMobileView)
  }, [])

  useEffect(() => {
    if (searchTerm) {
      applyFilters(users, searchTerm)
    } else {
      setFilteredUsers(users.slice(0, page * 20))
    }
  }, [searchTerm, users, page])

const fetchUserPreference = async (email: string): Promise<string> => {
  const cached = preferenceCache.get(email);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < 600000)) {
    return cached.photoUrl;
  }
  
  try {
    const prefResponse = await fetch(`/api/users/get-preference-by-email?email=${encodeURIComponent(email)}`);
    if (prefResponse.ok) {
      const prefData = await prefResponse.json();
      const photoUrl = prefData.preferences?.photoUrl || `/placeholder.svg?height=200&width=200`;
      
      preferenceCache.set(email, { 
        photoUrl,
        timestamp: now
      });
      
      return photoUrl;
    }
  } catch (error) {
    console.error(`Error fetching preferences for ${email}:`, error);
  }
  
  return `/placeholder.svg?height=200&width=200`;
}



  const fetchUserAdditionalInfo = async (email: string) => {
    const cached = additionalInfoCache.get(email)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp < 600000)) {
      return cached.data
    }
    
    try {
      const response = await fetch(`/api/users/get-additional-info-messages?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        
        additionalInfoCache.set(email, { 
          data: data.additionalInfo,
          timestamp: now
        })
        
        return data.additionalInfo
      }
    } catch (error) {
      console.error(`Error fetching additional info for ${email}:`, error)
    }
    
    return null
  }

  const fetchUsers = useCallback(async (initialLoad = false) => {
    if (initialLoad) setIsLoading(true)
    
    try {
      const response = await fetch(`/api/users?page=${initialLoad ? 1 : page}&limit=20&search=${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.users.filter((user: User) => user.email !== session?.user?.email);
        
        if (initialLoad) {
          setUsers(filteredData);
          setFilteredUsers(filteredData);
          setIsLoading(false);
          
          fetchUserDetailsInBackground(filteredData);
        } else {
          setUsers(prev => [...prev, ...filteredData]);
          setFilteredUsers(prev => [...prev, ...filteredData]);
        }
        
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      sonnerToast.error("Failed to fetch users");
      setIsLoading(false);
    }
  }, [page, searchTerm, session]);

  const fetchUserDetailsInBackground = async (userList: User[]) => {
    const updatedUsers = [...userList];
    

    const batchSize = 5;
    for (let i = 0; i < updatedUsers.length; i += batchSize) {
      const batch = updatedUsers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user, index) => {
          const position = i + index;
          const photoUrl = await fetchUserPreference(user.email);
          const additionalInfo = await fetchUserAdditionalInfo(user.email);
          
          updatedUsers[position] = {
            ...user,
            profilePicture: photoUrl,
            additionalInfo
          };
        })
      );
      
      setUsers([...updatedUsers]);
      applyFilters([...updatedUsers], searchTerm);
      

      if (i + batchSize < updatedUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const loadMoreUsers = () => {
    if (!hasMore || loadingMore || searchTerm) return
    
    setLoadingMore(true)
    setPage(prevPage => prevPage + 1)
    
    fetchUsers(false).finally(() => {
      setLoadingMore(false)
    })
  }

  useEffect(() => {
    if (session) {
      fetchUsers(true)
    }
  }, [session, fetchUsers])

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
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    }

    fetchMessagesAndCheckStatus()
  }, [selectedUser, session])

  const applyFilters = (userList: User[], search: string) => {
    if (!search) {
      setFilteredUsers(userList.slice(0, page * 20))
      return
    }
    
    const term = search.toLowerCase()
    const result = userList.filter(
      (user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    )

    setFilteredUsers(result)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    setPage(1)
    applyFilters(users, term)
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
        sonnerToast.success("Message sent successfully")
        setMessage("")
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


const UserCard = React.memo(({ user, isLastElement = false }: { user: User, isLastElement?: boolean }) => (
  <div 
    ref={isLastElement ? lastUserElementRef : null}
    className="h-full"
  >
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
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
  </div>
))


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
        {filteredUsers.map((user, index) => (
          <UserCard 
            key={user.email} 
            user={user} 
            isLastElement={index === filteredUsers.length - 1}
          />
        ))}
        {loadingMore && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    )
  }

  if (isMobileView) {
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
        <div className="relative z-10 flex flex-col h-full w-full">
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
                    onChange={(e) => setMessage(e.target.value)}
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
            onOpenChange={(open) => {
              setIsMessageDialogOpen(open);
              if (!open) {
                setMessage("");
                if (isMobileView) {
                  setShowUserList(true);
                  setSelectedUser(null);
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
                        .map((n) => n[0])
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
                    onChange={(e) => setMessage(e.target.value)}
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
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      
      
      {/* Content Container */}
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

          {renderUserCards()}
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
                      .map((n) => n[0])
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
                  onChange={(e) => setMessage(e.target.value)}
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

        <Toaster />
      </div>
    </div>
  )
}