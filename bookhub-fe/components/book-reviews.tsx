"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { fetchBookReviews, submitBookReview, deleteBookReview, getAuthToken } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface BookReviewsProps {
  bookId: string
}

export function BookReviews({ bookId }: BookReviewsProps) {
  const [reviewSummary, setReviewSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)

  useEffect(() => {
    const token = getAuthToken()
    setIsLoggedIn(!!token)

    const getReviews = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchBookReviews(bookId)
        console.log("Book reviews data:", data)
        setReviewSummary(data)

        // Nếu người dùng đã đăng nhập và có rating, hiển thị rating của họ
        if (token && data && data.user_score) {
          setUserRating(data.user_score)
          setRating(data.user_score)
        }
      } catch (err) {
        setError("Failed to load reviews")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    getReviews()
  }, [bookId])

  const handleSubmitReview = async () => {
    if (!rating) {
      alert("Please select a rating")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await submitBookReview(bookId, { rating })

      // Refresh the reviews after submitting
      const data = await fetchBookReviews(bookId)
      setReviewSummary(data)
      setUserRating(rating)
    } catch (err) {
      setError("Failed to submit review")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      await deleteBookReview(bookId)

      // Refresh the reviews after deleting
      const data = await fetchBookReviews(bookId)
      setReviewSummary(data)
      setUserRating(null)
      setRating(0)
    } catch (err) {
      setError("Failed to delete review")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
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
    <div className="space-y-6">
      {/* Form đánh giá chỉ cho user đã đăng nhập */}
      {isLoggedIn ? (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Rate This Book</h3>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoveredRating(i + 1)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    i < (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select rating"}
            </span>
          </div>

          {userRating ? (
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Rating"}
              </Button>
              <Button variant="outline" onClick={handleDeleteReview} disabled={isSubmitting}>
                {isSubmitting ? "Deleting..." : "Delete Rating"}
              </Button>
            </div>
          ) : (
            <Button onClick={handleSubmitReview} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-4 text-center">
          <p className="mb-4 text-muted-foreground">Please log in to rate this book</p>
          <Button asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      )}

      {/* Tổng quan rating: luôn hiển thị cho mọi user */}
      <h3 className="text-lg font-semibold">Ratings ({reviewSummary?.total_ratings || 0})</h3>
      {loading ? (
        <Skeleton className="h-[200px] w-full" />
      ) : reviewSummary ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{reviewSummary.average_score?.toFixed(1) || 0}</span>
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(reviewSummary.average_score || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {reviewSummary.total_ratings || 0} {reviewSummary.total_ratings === 1 ? "rating" : "ratings"}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-2">{star}</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-yellow-400"
                      style={{
                        width: `${
                          reviewSummary.total_ratings
                            ? ((reviewSummary.summary?.[star] || 0) / reviewSummary.total_ratings) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-muted-foreground">
                    {reviewSummary.summary?.[star] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </div>
      ) : (
        <p className="py-4 text-center text-muted-foreground">No ratings yet. Be the first to rate!</p>
      )}
    </div>
  )
}
