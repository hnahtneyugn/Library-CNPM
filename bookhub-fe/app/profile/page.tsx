"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, User, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { getUserProfile, getFavoriteBooks, removeBookFromFavorites } from "@/lib/api"
import { BookCard } from "@/components/book-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken, isValidToken } from "@/lib/auth"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [favoriteBooks, setFavoriteBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingBook, setRemovingBook] = useState<string | null>(null)

  // Cập nhật useEffect để xử lý trạng thái đăng nhập tốt hơn

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Kiểm tra token trước
        const token = getAuthToken()
        if (!token) {
          console.log("No auth token found, redirecting to login")
          router.push("/login")
          return
        }

        // Kiểm tra token có hợp lệ không
        const isValid = await isValidToken()
        if (!isValid) {
          console.log("Invalid token, redirecting to login")
          localStorage.removeItem("auth_token")
          router.push("/login")
          return
        }

        // Nếu token hợp lệ, tiếp tục lấy dữ liệu
        const [userData, favoritesData] = await Promise.all([getUserProfile(), getFavoriteBooks()])

        if (!userData) {
          console.log("No user data returned, redirecting to login")
          localStorage.removeItem("auth_token")
          router.push("/login")
          return
        }

        setUser(userData)
        setFavoriteBooks(Array.isArray(favoritesData.favorite_books) ? favoritesData.favorite_books : [])
      } catch (err) {
        console.error("Failed to load profile data:", err)
        setError("Failed to load profile data")

        // Chỉ chuyển hướng nếu lỗi liên quan đến xác thực
        if (err instanceof Error && (err.message.includes("401") || err.message.includes("unauthorized"))) {
          localStorage.removeItem("auth_token")
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleRemoveFromFavorites = async (bookId: string) => {
    try {
      setRemovingBook(bookId)
      await removeBookFromFavorites(bookId)

      // Cập nhật state để xóa sách khỏi danh sách yêu thích
      setFavoriteBooks(favoriteBooks.filter((book) => book.work_key !== bookId))

      toast({
        title: "Removed from favorites",
        description: "The book has been removed from your favorites.",
        variant: "default",
      })
    } catch (err) {
      console.error("Error removing book from favorites:", err)
      toast({
        title: "Error",
        description: "There was an error removing the book from your favorites. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemovingBook(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
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

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.username}</h1>
            <p className="text-muted-foreground">BOOKHUB Member</p>
          </div>
        </div>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value="favorites" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Favorite Books</h2>
                <p className="text-sm text-muted-foreground">Books you've added to your favorites.</p>
              </div>
              <Separator />
              {favoriteBooks.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No favorites yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't added any books to your favorites yet.
                  </p>
                  <Button asChild className="mt-4">
                    <a href="/books">Browse Books</a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteBooks.map((book: any) => (
                    <div key={book.work_key} className="relative group">
                      <BookCard
                        id={book.work_key}
                        title={book.title}
                        author={book.author}
                        authorId={book.author?.key}
                        authorName={book.author?.name}
                        cover_id={book.cover_id}
                        rating={book.rating || 0}
                        subject={book.subjects?.[0] || "General"}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFromFavorites(book.work_key)}
                        disabled={removingBook === book.work_key}
                      >
                        {removingBook === book.work_key ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Remove from favorites</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
