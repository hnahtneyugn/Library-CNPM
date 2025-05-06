import Link from "next/link"
import { Star } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBookCoverUrl } from "@/lib/api"

interface BookCardProps {
  id: string
  title: string
  author?: {
    key: string
    name: string
  }
  authorId?: string
  authorName?: string
  coverImage?: string
  cover_id?: number
  rating?: number
  subject?: string
  subjects?: string[]
  category?: string
  categoryId?: string
}

export function BookCard({ id, title, coverImage, cover_id, rating = 0 }: BookCardProps) {
  // Đảm bảo các giá trị không bị undefined
  const safeTitle = title || "Unknown Title"

  // Xử lý hình ảnh bìa - sử dụng OpenLibrary nếu có cover_id
  const safeCoverImage = cover_id ? getBookCoverUrl(cover_id) : coverImage || "/placeholder.svg?height=300&width=200"

  // Đảm bảo rating là một số và có giá trị hợp lệ
  const safeRating = typeof rating === "number" && !isNaN(rating) ? rating : 0

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/books/${id}`}>
        <div className="aspect-[2/3] w-full overflow-hidden">
          <img
            src={safeCoverImage || "/placeholder.svg"}
            alt={safeTitle}
            className="h-full w-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              // Fallback nếu hình ảnh không tải được
              e.currentTarget.src = "/placeholder.svg?height=300&width=200"
            }}
          />
        </div>
      </Link>
      <CardHeader className="p-4">
        <div className="space-y-1">
          <Link href={`/books/${id}`} className="line-clamp-1 font-semibold hover:underline">
            {safeTitle}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(safeRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
              }`}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">({safeRating.toFixed(1)})</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/books/${id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
