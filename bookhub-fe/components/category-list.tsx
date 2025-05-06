"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchCategories } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function CategoryList() {
  const [categories, setCategories] = useState<{ name: string; book_count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        // Lấy danh sách categories từ API (sẽ sử dụng cache nếu có)
        const categoriesData = await fetchCategories()
        console.log("Categories data:", categoriesData)

        if (Array.isArray(categoriesData)) {
          // Lấy 8 categories có nhiều sách nhất
          const topCategories = categoriesData.sort((a, b) => b.book_count - a.book_count).slice(0, 8)
          setCategories(topCategories)
        } else {
          setCategories([])
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
        setError("Failed to load categories")
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    getCategories()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8">
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
      ) : categories.length > 0 ? (
        categories.map((category) => (
          <Link
            key={category.name}
            href={`/subjects/${encodeURIComponent(category.name)}`}
            className="flex flex-col items-center justify-center rounded-xl border bg-card p-6 text-card-foreground shadow transition-colors hover:bg-muted/50"
          >
            <BookOpen className="mb-2 h-8 w-8 text-emerald-500" />
            <h3 className="text-center font-medium">{category.name}</h3>
            <p className="text-center text-sm text-muted-foreground">{category.book_count} books</p>
          </Link>
        ))
      ) : (
        <div className="col-span-full text-center py-6">
          <p className="text-muted-foreground">No categories available. Please try again later.</p>
        </div>
      )}
    </div>
  )
}
