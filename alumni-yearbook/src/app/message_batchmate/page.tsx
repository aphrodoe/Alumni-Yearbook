'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner"
import { Send, Search, UserCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type User = {
  email: string;
  name: string;
};

type Message = {
  email_sender: string;
  email_receiver: string;
  message: string;
  timestamp: Date;
};

export default function MessageBatchmate() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canMessage, setCanMessage] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showUserList, setShowUserList] = useState(true);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();

    window.addEventListener('resize', checkMobileView);

    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          const filteredData = data.filter((user: User) => user.email !== session?.user?.email);
          setUsers(filteredData);
          setFilteredUsers(filteredData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
      }
    };

    if (session) {
      fetchUsers();
    }
  }, [session]);


  useEffect(() => {
    const fetchMessagesAndCheckStatus = async () => {
      if (!selectedUser || !session) return;
    
      try {
        const response = await fetch('/api/messages/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: session.user?.email,
            receiver: selectedUser.email
          })
        });
    
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
          setCanMessage(data.canMessage);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages');
      }
    };

    fetchMessagesAndCheckStatus();
  }, [selectedUser, session]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
    
    setFilteredUsers(filtered);
  };


const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  if (!message || !selectedUser || !session?.user?.email) {
    toast.error("Please select a user and type a message");
    return;
  }
  
  if (!canMessage) {
    toast.error("You can only send one message to this user");
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/messageb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email_sender: session.user.email,
        email_receiver: selectedUser.email, 
        message 
      }),
    });
  
    if (response.ok) {
      const newMessage = await response.json();
      
      setMessages(prevMessages => [...prevMessages, newMessage]);

      setCanMessage(false);
      
      toast.success("Message sent successfully");
      setMessage('');
    } else {
      toast.error("Failed to send message");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    toast.error("Failed to send message");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    if (isMobileView) {
      setShowUserList(false);
    }
  };

  const handleBackToUserList = () => {
    setShowUserList(true);
    setSelectedUser(null);
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

  if (isMobileView) {
    return (
      <SidebarProvider>
        <div className="flex flex-col h-screen w-full">
          <header className="flex items-center justify-between p-4 bg-white shadow-sm w-full">
            <div className="flex items-center w-full">
              <SidebarTrigger className="mr-3" />
              <h1 className="text-xl font-semibold">Message Batchmates</h1>
            </div>
          </header>

          {showUserList ? (
            <div className="flex-grow overflow-y-auto w-full">
              <div className="p-4 w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              <div className="p-4 space-y-2 w-full">
                {filteredUsers.map(user => (
                  <div 
                    key={user.email} 
                    className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm w-full"
                    onClick={() => handleUserSelect(user)}
                  >
                    <UserCircle2 className="mr-3 text-gray-500 flex-shrink-0" size={40} />
                    <div className="overflow-hidden">
                      <div className="font-semibold truncate">{user.name}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full">
              <header className="flex items-center p-4 bg-white shadow-sm w-full">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2"
                  onClick={handleBackToUserList}
                >
                  <ArrowLeft size={24} />
                </Button>
                <UserCircle2 className="mr-3 text-gray-500" size={40} />
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
                    className={`flex ${msg.email_sender === session.user?.email ? 'justify-end' : 'justify-start'} w-full`}
                  >
                    <div 
                      className={`max-w-[70%] p-2 rounded-lg ${
                        msg.email_sender === session.user?.email 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-black'
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
                  <p className="text-sm text-red-500 mt-2">
                    You have already sent a message to this user
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
        <AppSidebar />
      </SidebarProvider>
    );
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Message Batchmates</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-1/4 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input 
                  placeholder="Search users..." 
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            {filteredUsers.map(user => (
              <div 
                key={user.email} 
                className={`p-4 flex items-center cursor-pointer hover:bg-gray-100 ${selectedUser?.email === user.email ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <UserCircle2 className="mr-3 text-gray-500" size={40} />
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="w-3/4 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You can message a person once. This message will appear in their personalised yearbook.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="p-4 border-b flex items-center">
                  <UserCircle2 className="mr-3 text-gray-500" size={40} />
                  <div>
                    <div className="font-semibold">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-2">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.email_sender === session.user?.email ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] p-2 rounded-lg ${
                          msg.email_sender === session.user?.email 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-black'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 border-t">
                  <div className="flex items-center">
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
                    <p className="text-sm text-red-500 mt-2">
                      You have already sent a message to this user
                    </p>
                  )}
                </form>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-500">
                Select a user to start messaging
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}