import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import Image from "next/image"

// Sample feed data
const feedItems = [
  {
    id: 1,
    user: {
      name: "Peter Parker",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "PP",
    },
    content: "Just hanging around campus for the last time. Going to miss this place!",
    image: "/placeholder.svg?height=400&width=600",
    likes: 42,
    comments: 7,
    time: "2 hours ago",
  },
  {
    id: 2,
    user: {
      name: "MJ Watson",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "MJ",
    },
    content: "Final drama club performance was amazing! Thanks to everyone who came to support us.",
    image: "/placeholder.svg?height=400&width=600",
    likes: 38,
    comments: 5,
    time: "5 hours ago",
  },
  {
    id: 3,
    user: {
      name: "Ned Leeds",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "NL",
    },
    content: "Computer Science club group photo! We built some amazing projects this year.",
    image: "/placeholder.svg?height=400&width=600",
    likes: 27,
    comments: 3,
    time: "1 day ago",
  },
]

export default function FeedContent() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-6 pt-4">Class Feed</h2>

      {feedItems.map((item) => (
        <Card key={item.id} className="border-blue-100 bg-white shadow-sm text-gray-800 overflow-hidden">
          <CardHeader className="p-4 flex flex-row items-center space-x-4 space-y-0">
            <Avatar>
              <AvatarImage src={item.user.avatar} alt={item.user.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600">{item.user.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{item.user.name}</h3>
              <p className="text-sm text-gray-500">{item.time}</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <p className="px-4 py-2">{item.content}</p>
            <div className="aspect-video w-full bg-gray-100 overflow-hidden relative">
              <Image 
                src={item.image || "/placeholder.svg"} 
                alt="Post content" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 flex justify-between">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
              <Heart className="mr-1 h-4 w-4" /> {item.likes}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
              <MessageCircle className="mr-1 h-4 w-4" /> {item.comments}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
              <Share2 className="mr-1 h-4 w-4" /> Share
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}