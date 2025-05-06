"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bookmark, Star, User } from "lucide-react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookReviews } from "@/components/book-reviews"
import { BookComments } from "@/components/book-comments"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  getBookById,
  addBookToFavorites,
  removeBookFromFavorites,
  getAuthToken,
  checkBookIsFavorite,
  getBookCoverUrl,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function BookPage() {
  // Sử dụng useParams thay vì truy cập params trực tiếp
  const params = useParams()
  const bookId = params.id as string

  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const token = getAuthToken()
    setIsLoggedIn(!!token)

    const fetchBookDetails = async () => {
      try {
        setLoading(true)

        // Lấy thông tin sách
        const bookData = await getBookById(bookId)
        console.log("Book details:", bookData)

        if (!bookData) {
          setError("Book not found")
          return
        }

        // Đảm bảo sách có rating, ngay cả khi không có dữ liệu từ API
        setBook({
          ...bookData,
          rating: bookData.rating || 0,
        })

        // Nếu đã đăng nhập, kiểm tra xem sách có trong danh sách yêu thích không
        if (token) {
          try {
            const isFav = await checkBookIsFavorite(bookId)
            setIsFavorite(isFav)
          } catch (err) {
            console.error("Error checking favorite status:", err)
          }
        }
      } catch (err) {
        setError("Failed to load book details")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (bookId) {
      fetchBookDetails()
    }
  }, [bookId])

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    setIsLoading(true)
    try {
      if (isFavorite) {
        await removeBookFromFavorites(bookId)
        setIsFavorite(false)
        toast({
          title: "Removed from favorites",
          description: "The book has been removed from your favorites.",
          variant: "default",
        })
      } else {
        await addBookToFavorites(bookId)
        setIsFavorite(true)
        toast({
          title: "Added to favorites",
          description: "The book has been added to your favorites.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "There was an error updating your favorites. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Separator />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={() => window.location.reload()} className="ml-4" variant="outline" size="sm">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Lấy URL ảnh bìa từ cover_id
  const coverImage = book?.cover_id ? getBookCoverUrl(book.cover_id, "L") : "/placeholder.svg?height=600&width=400"

  // Lấy thông tin rating từ book
  const averageRating = book?.rating || 0
  const totalRatings = book?.total_ratings || 0

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/books" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="aspect-[2/3] overflow-hidden rounded-lg border">
              <img
                src={coverImage || "/placeholder.svg"}
                alt={book.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=600&width=400"
                }}
              />
            </div>
            <div className="mt-6 flex flex-col gap-4">
              <Button
                onClick={handleToggleFavorite}
                disabled={isLoading}
                variant={isFavorite ? "default" : "outline"}
                className={isFavorite ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isFavorite ? "fill-white" : ""}`} />
                {isLoading ? "Processing..." : isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{book.title}</h1>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({totalRatings} ratings)
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="mt-2 text-muted-foreground">{book.description || "No description available."}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Details</h2>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                <div className="flex justify-between sm:block">
                  <dt className="text-sm font-medium text-muted-foreground">Published</dt>
                  <dd className="text-sm">{book.first_publish_year || "Unknown"}</dd>
                </div>
                <div className="flex justify-between sm:block">
                  <dt className="text-sm font-medium text-muted-foreground">Pages</dt>
                  <dd className="text-sm">{book.number_of_pages || "Unknown"}</dd>
                </div>
                <div className="flex justify-between sm:block">
                  <dt className="text-sm font-medium text-muted-foreground">Publishers</dt>
                  <dd className="text-sm">{book.publishers?.join(", ") || "Unknown"}</dd>
                </div>
                <div className="flex justify-between sm:block">
                  <dt className="text-sm font-medium text-muted-foreground">ISBN</dt>
                  <dd className="text-sm">{book.isbn?.[0] || "Unknown"}</dd>
                </div>
              </dl>
            </div>

            <Separator />

            <Tabs defaultValue="reviews">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reviews">
                  <Star className="mr-2 h-4 w-4" />
                  Ratings
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <User className="mr-2 h-4 w-4" />
                  Comments
                </TabsTrigger>
              </TabsList>
              <TabsContent value="reviews" className="mt-6">
                <BookReviews bookId={bookId} />
              </TabsContent>
              <TabsContent value="comments" className="mt-6">
                <BookComments bookId={bookId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
