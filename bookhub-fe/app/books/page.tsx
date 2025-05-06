"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BookCard } from "@/components/book-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchBooks } from "@/lib/api"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function BooksPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [orderBy, setOrderBy] = useState<string>("title")
  const [order, setOrder] = useState<string>("asc")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const booksPerPage = 12

  // Sử dụng ref để theo dõi nếu component đã mount
  const isMounted = useRef(false)

  // Chỉ lấy query từ URL khi component mount lần đầu
  useEffect(() => {
    const urlSearchQuery = searchParams.get("search") || ""
    console.log("URL search query:", urlSearchQuery)
    setSearchQuery(urlSearchQuery)
    isMounted.current = true
  }, [])

  // Fetch books khi các điều kiện tìm kiếm thay đổi
  useEffect(() => {
    // Chỉ fetch khi component đã mount
    if (!isMounted.current) return

    const fetchBooksData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching books with search:", searchQuery)

        const booksData = await fetchBooks({
          offset: 0,
          limit: booksPerPage,
          order_by: orderBy,
          order: order,
          search: searchQuery || undefined,
        })

        if (Array.isArray(booksData) && booksData.length > 0) {
          // Đảm bảo mỗi sách có rating, ngay cả khi không có dữ liệu từ API
          const booksWithRatings = booksData.map((book) => ({
            ...book,
            rating: book.rating || 0, // Sử dụng rating từ API nếu có, nếu không thì mặc định là 0
          }))
          setBooks(booksWithRatings)
        } else {
          setBooks([])
        }

        setHasMore(Array.isArray(booksData) && booksData.length === booksPerPage)
        setPage(1)
      } catch (err) {
        console.error("Error fetching books:", err)
        setError(err instanceof Error ? err.message : "Failed to load books")
      } finally {
        setLoading(false)
      }
    }

    fetchBooksData()
  }, [searchQuery, orderBy, order])

  // Xử lý khi người dùng submit form tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Cập nhật URL với query hiện tại
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/books")
    }
  }

  // Xử lý khi người dùng thay đổi giá trị trong input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("Input changed to:", value)
    setSearchQuery(value)
  }

  // Xử lý khi người dùng nhấn nút xóa
  const clearSearch = () => {
    console.log("Clearing search")
    setSearchQuery("")
    router.push("/books")
  }

  // Xử lý khi người dùng thay đổi cách sắp xếp
  const handleSortChange = (value: string) => {
    const [newOrderBy, newOrder] = value.split("-")
    setOrderBy(newOrderBy)
    setOrder(newOrder)
  }

  // Xử lý khi người dùng tải thêm sách
  const loadMoreBooks = async () => {
    try {
      setLoading(true)
      const nextPage = page + 1
      const offset = (nextPage - 1) * booksPerPage

      const moreBooks = await fetchBooks({
        offset,
        limit: booksPerPage,
        order_by: orderBy,
        order: order,
        search: searchQuery || undefined,
      })

      if (Array.isArray(moreBooks) && moreBooks.length > 0) {
        // Đảm bảo mỗi sách có rating, ngay cả khi không có dữ liệu từ API
        const moreBooksWithRatings = moreBooks.map((book) => ({
          ...book,
          rating: book.rating || 0, // Sử dụng rating từ API nếu có, nếu không thì mặc định là 0
        }))

        setBooks((prev) => [...prev, ...moreBooksWithRatings])
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

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Books</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={() => window.location.reload()} className="ml-4" variant="outline" size="sm">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 mb-8 md:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={handleInputChange}
                className="w-full pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>
        <div className="w-full md:w-[200px]">
          <Select value={`${orderBy}-${order}`} onValueChange={handleSortChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              <SelectItem value="first_publish_year-desc">Newest</SelectItem>
              <SelectItem value="first_publish_year-asc">Oldest</SelectItem>
              <SelectItem value="views-desc">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && page === 1
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))
          : books.map((book: any) => (
              <BookCard
                key={book.work_key}
                id={book.work_key}
                title={book.title}
                cover_id={book.cover_id}
                rating={book.rating || 0}
              />
            ))}
      </div>

      {books.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No books found. Try a different search or category.</p>
          <Button onClick={clearSearch} className="mt-4">
            Reset Search
          </Button>
        </div>
      )}

      {hasMore && books.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMoreBooks} disabled={loading} variant="outline" className="px-8">
            {loading ? "Loading..." : "Load More Books"}
          </Button>
        </div>
      )}
    </div>
  )
}
