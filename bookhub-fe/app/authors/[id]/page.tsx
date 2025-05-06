"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BookCard } from "@/components/book-card"
import { getAuthorById, getAuthorBooks } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AuthorPage({ params }: { params: { id: string } }) {
  const [author, setAuthor] = useState<any>(null)
  const [books, setBooks] = useState<any[]>([])
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

        // Lấy thông tin chi tiết về tác giả
        const authorData = await getAuthorById(params.id)

        if (authorData) {
          setAuthor({
            key: params.id,
            name: authorData.name || authorData.personal_name || "Unknown Author",
            personal_name: authorData.personal_name,
            birth_date: authorData.birth_date,
            bio: authorData.bio,
            photos: authorData.photos,
            alternate_names: authorData.alternate_names,
          })
        } else {
          setAuthor({
            key: params.id,
            name: "Unknown Author",
          })
        }

        // Lấy sách của tác giả
        const booksData = await getAuthorBooks(params.id, 0, booksPerPage)

        if (Array.isArray(booksData)) {
          setBooks(booksData)
          setHasMore(booksData.length === booksPerPage)
        } else {
          setBooks([])
          setHasMore(false)
        }
      } catch (err) {
        console.error("Error fetching author data:", err)
        setError("Failed to load author data")
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

      const moreBooks = await getAuthorBooks(params.id, offset, booksPerPage)

      if (Array.isArray(moreBooks) && moreBooks.length > 0) {
        setBooks((prev) => [...prev, ...moreBooks])
        setPage(nextPage)
        setHasMore(moreBooks.length === booksPerPage)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("Error loading more books:", err)
      setError("Failed to load more books")
    } finally {
      setLoading(false)
    }
  }

  // Hàm để lấy URL ảnh tác giả nếu có
  const getAuthorPhotoUrl = () => {
    if (author?.photos && author.photos.length > 0) {
      return `https://covers.openlibrary.org/a/id/${author.photos[0]}-M.jpg`
    }
    return "/placeholder.svg?height=300&width=300"
  }

  if (loading && !author) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Separator />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
              ))}
            </div>
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

  if (!author) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Author Not Found</AlertTitle>
          <AlertDescription>
            The author you are looking for could not be found.
            <Button asChild className="ml-4" variant="outline" size="sm">
              <Link href="/authors">Browse Authors</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/books" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Books
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="aspect-square overflow-hidden rounded-lg border">
              <img
                src={getAuthorPhotoUrl() || "/placeholder.svg"}
                alt={author.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              <h1 className="text-2xl font-bold">{author.name}</h1>
              {author.birth_date && <p className="text-sm text-muted-foreground">Born: {author.birth_date}</p>}
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {books.length} {books.length === 1 ? "book" : "books"}
                </span>
              </div>
              {author.alternate_names && author.alternate_names.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium">Also known as:</p>
                  <ul className="mt-1 text-sm text-muted-foreground">
                    {author.alternate_names.map((name: string, index: number) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">About the Author</h2>
              {author.bio ? (
                <div className="mt-2 text-muted-foreground">
                  <p>{typeof author.bio === "string" ? author.bio : "No biography available."}</p>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">No biography available.</p>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold">Books</h2>
              {books.length === 0 ? (
                <div className="mt-4 rounded-lg border p-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No books found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No books found for this author.</p>
                  <Button asChild className="mt-4">
                    <Link href="/books">Browse All Books</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {books.map((book: any) => (
                      <BookCard
                        key={book.work_key}
                        id={book.work_key}
                        title={book.title}
                        authorName={author.name}
                        authorId={author.key}
                        cover_id={book.cover_id}
                        rating={book.rating || 0}
                        subjects={book.subjects || []}
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
          </div>
        </div>
      </div>
    </div>
  )
}
