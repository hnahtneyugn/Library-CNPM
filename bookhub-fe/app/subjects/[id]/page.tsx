"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/book-card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchBooksByCategory } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SubjectPage({ params }: { params: { id: string } }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const booksPerPage = 12

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Decode the subject name from URL
        const subjectName = decodeURIComponent(params.id)
        // Get books in this subject
        const booksData = await fetchBooksByCategory(subjectName, 0, booksPerPage)
        setBooks(Array.isArray(booksData) ? booksData : [])
        setHasMore(Array.isArray(booksData) && booksData.length === booksPerPage)
        setPage(1)
      } catch (err) {
        setError("Failed to load subject data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const loadMoreBooks = async () => {
    try {
      setLoading(true)
      const nextPage = page + 1
      const offset = (nextPage - 1) * booksPerPage
      const subjectName = decodeURIComponent(params.id)

      const moreBooks = await fetchBooksByCategory(subjectName, offset, booksPerPage)

      if (Array.isArray(moreBooks) && moreBooks.length > 0) {
        setBooks((prev) => [...prev, ...moreBooks])
        setPage(nextPage)
        setHasMore(moreBooks.length === booksPerPage)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("Error loading more books:", err)
      setError(err instanceof Error ? err.message : "Failed to load more books")
    } finally {
      setLoading(false)
    }
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

  const subjectName = decodeURIComponent(params.id)

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/books" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Link>
      </Button>

      {loading && page === 1 ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-6 w-full max-w-[600px]" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{subjectName}</h1>
            <p className="mt-2 text-muted-foreground">
              {books.length} {books.length === 1 ? "book" : "books"} found
            </p>
          </div>

          {books.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <h3 className="text-lg font-semibold">No books found</h3>
              <p className="mt-2 text-sm text-muted-foreground">There are no books in this category yet.</p>
              <Button asChild className="mt-4">
                <Link href="/books">Browse All Books</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book: any) => (
                  <BookCard
                    key={book.work_key}
                    id={book.work_key}
                    title={book.title}
                    author={book.author}
                    authorId={book.author?.key}
                    authorName={book.author?.name}
                    cover_id={book.cover_id}
                    rating={book.rating || 0}
                    subject={subjectName}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button onClick={loadMoreBooks} disabled={loading} variant="outline" className="px-8">
                    {loading ? "Loading..." : "Load More Books"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
