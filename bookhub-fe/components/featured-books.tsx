"use client"

import { useEffect, useState } from "react"
import { BookCard } from "@/components/book-card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchFeaturedBooks, fetchBookReviews } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FeaturedBooks() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getBooks = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchFeaturedBooks()
        console.log("Featured books data:", data)

        // Nếu có dữ liệu sách, lấy thêm thông tin rating cho mỗi sách
        if (Array.isArray(data) && data.length > 0) {
          const booksWithRatings = await Promise.all(
            data.map(async (book) => {
              try {
                // Lấy thông tin rating cho sách
                const ratingData = await fetchBookReviews(book.work_key)
                // Thêm thông tin rating vào sách
                return {
                  ...book,
                  rating: ratingData?.average_score || 0,
                }
              } catch (err) {
                console.error(`Error fetching rating for book ${book.work_key}:`, err)
                // Nếu có lỗi khi lấy rating, vẫn trả về sách với rating mặc định
                return {
                  ...book,
                  rating: 0,
                }
              }
            }),
          )
          setBooks(booksWithRatings)
        } else {
          setBooks([])
        }
      } catch (err) {
        console.error("Error in FeaturedBooks:", err)
        setError(err instanceof Error ? err.message : "Failed to load featured books")
      } finally {
        setLoading(false)
      }
    }

    getBooks()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button onClick={() => window.location.reload()} className="ml-4" variant="outline" size="sm">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))
      ) : books.length > 0 ? (
        books.map((book: any) => (
          <BookCard
            key={book.work_key || `featured-${Math.random()}`}
            id={book.work_key}
            title={book.title}
            cover_id={book.cover_id}
            rating={book.rating || 0}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-10">
          <p className="text-muted-foreground">No featured books available at the moment.</p>
        </div>
      )}
    </div>
  )
}
