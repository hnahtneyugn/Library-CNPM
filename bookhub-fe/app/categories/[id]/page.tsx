"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/book-card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchBooksByCategory, fetchCategories } from "@/lib/api"

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [books, setBooks] = useState([])
  const [category, setCategory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get category name
        const categories = await fetchCategories()
        const currentCategory = categories.find((cat: any) => cat.id === params.id)
        setCategory(currentCategory)

        // Get books in this category
        const booksData = await fetchBooksByCategory(params.id)
        setBooks(booksData)
      } catch (err) {
        setError("Failed to load category data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (error) {
    return (
      <div className="container py-10 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/categories" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Link>
      </Button>

      {loading ? (
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
            <h1 className="text-3xl font-bold">{category?.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Explore our collection of {books.length} {books.length === 1 ? "book" : "books"} in the {category?.name}{" "}
              category.
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book: any) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author.name}
                  authorId={book.author.id}
                  coverImage={book.cover_image}
                  rating={book.rating}
                  category={category?.name}
                  categoryId={category?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
