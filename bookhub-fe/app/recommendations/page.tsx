"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/book-card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchRecommendations, getAuthToken } from "@/lib/api"

export default function RecommendationsPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    setIsLoggedIn(!!token)

    if (token) {
      const getRecommendations = async () => {
        try {
          setLoading(true)
          const data = await fetchRecommendations()
          setBooks(data)
        } catch (err) {
          setError("Failed to load recommendations")
          console.error(err)
        } finally {
          setLoading(false)
        }
      }

      getRecommendations()
    } else {
      setLoading(false)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Book Recommendations</h1>
        <div className="rounded-lg border p-8 max-w-md mx-auto">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Login Required</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please log in to see personalized book recommendations.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Book Recommendations</h1>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Recommended for You</h1>
      <p className="text-muted-foreground mb-8">
        Based on your reading history and preferences, we think you might enjoy these books.
      </p>

      {loading ? (
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
      ) : books.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No recommendations yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Rate more books or explore our collection to get personalized recommendations.
          </p>
          <Button asChild className="mt-4">
            <Link href="/books">Browse Books</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book: any) => (
            <BookCard
              key={book.work_key}
              id={book.work_key}
              title={book.title}
              author={book.author.name}
              authorId={book.author.key}
              coverImage={book.cover_url}
              rating={book.rating || 0}
              subject={book.subject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
