"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ThumbsUp, ThumbsDown, Reply, Trash2, Send, User, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  fetchBookComments,
  submitBookComment,
  fetchCommentReplies,
  replyToComment,
  deleteComment,
  likeComment,
  getCommentLikes,
  getUserProfile,
  getAuthToken,
  formatDate,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BookCommentsProps {
  bookId: string
}

export function BookComments({ bookId }: BookCommentsProps) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({})
  const [commentLikes, setCommentLikes] = useState<
    Record<number, { likes: number; dislikes: number; userLike: number | null }>
  >({})
  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Fetch comments and user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is logged in
        const token = getAuthToken()
        setIsLoggedIn(!!token)

        // Get user profile if logged in
        if (token) {
          const userData = await getUserProfile()
          setUser(userData)
        }

        // Fetch comments
        await refreshComments()
      } catch (err) {
        console.error("Error fetching comments:", err)
        setError("Failed to load comments. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bookId])

  // Refresh all comments and their replies
  const refreshComments = async () => {
    try {
      setRefreshing(true)
      const commentsData = await fetchBookComments(bookId)

      // Sort comments by created_at (newest first)
      const sortedComments = Array.isArray(commentsData)
        ? commentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : []

      setComments(sortedComments)

      // Fetch likes for each comment
      const likesData: Record<number, { likes: number; dislikes: number; userLike: number | null }> = {}

      for (const comment of sortedComments) {
        try {
          const likeData = await getCommentLikes(bookId, comment.comment_id)
          likesData[comment.comment_id] = {
            likes: likeData.likes_count || 0,
            dislikes: likeData.dislikes_count || 0,
            userLike: null, // We don't know if the user liked/disliked this comment
          }
        } catch (error) {
          console.error(`Error fetching likes for comment ${comment.comment_id}:`, error)
        }

        // Luôn tải sẵn replies cho mỗi comment
        try {
          await fetchReplies(comment.comment_id)
          // Mặc định hiển thị tất cả replies
          setExpandedReplies((prev) => ({
            ...prev,
            [comment.comment_id]: true,
          }))
        } catch (error) {
          console.error(`Error pre-fetching replies for comment ${comment.comment_id}:`, error)
        }
      }

      setCommentLikes(likesData)
    } catch (error) {
      console.error("Error refreshing comments:", error)
      setError("Failed to refresh comments. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch replies for a specific comment
  const fetchReplies = async (commentId: number) => {
    try {
      const repliesData = await fetchCommentReplies(bookId, commentId)

      // Sort replies by created_at (oldest first)
      const sortedReplies = Array.isArray(repliesData)
        ? repliesData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        : []

      // Update the comment with its replies
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.comment_id === commentId ? { ...comment, replies: sortedReplies } : comment,
        ),
      )

      // Fetch likes for each reply
      for (const reply of sortedReplies) {
        try {
          const likeData = await getCommentLikes(bookId, reply.comment_id)
          setCommentLikes((prev) => ({
            ...prev,
            [reply.comment_id]: {
              likes: likeData.likes_count || 0,
              dislikes: likeData.dislikes_count || 0,
              userLike: null,
            },
          }))
        } catch (error) {
          console.error(`Error fetching likes for reply ${reply.comment_id}:`, error)
        }
      }
    } catch (error) {
      console.error(`Error fetching replies for comment ${commentId}:`, error)
    }
  }

  // Toggle showing replies for a comment
  const toggleReplies = async (commentId: number) => {
    const isExpanded = expandedReplies[commentId]

    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !isExpanded,
    }))

    if (!isExpanded) {
      await fetchReplies(commentId)
    }
  }

  // Handle submitting a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    if (!newComment.trim()) return

    try {
      setLoading(true)

      // Submit the comment
      await submitBookComment(bookId, { content: newComment })

      // Clear the input
      setNewComment("")

      // Refresh comments to show the new one
      await refreshComments()

      // Show success message or toast
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      })
    } catch (error) {
      console.error("Error submitting comment:", error)
      setError("Failed to submit comment. Please try again.")
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle replying to a comment
  const handleReply = async (commentId: number) => {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    if (!replyContent.trim()) return

    try {
      setLoading(true)

      // Submit the reply
      await replyToComment(bookId, commentId, { content: replyContent })

      // Clear the input and reset replying state
      setReplyContent("")
      setReplyingTo(null)

      // Make sure replies are expanded for this comment
      setExpandedReplies((prev) => ({
        ...prev,
        [commentId]: true,
      }))

      // Refresh comments to show the new reply
      await fetchReplies(commentId)

      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      })
      // Show success message or toast
    } catch (error) {
      console.error("Error submitting reply:", error)
      setError("Failed to submit reply. Please try again.")
      toast({
        title: "Error",
        description: "Failed to post your reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: number) => {
    if (!isLoggedIn) return

    if (!window.confirm("Are you sure you want to delete this comment?")) return

    try {
      setLoading(true)

      // Delete the comment
      await deleteComment(bookId, commentId)

      // Refresh comments to update the list
      await refreshComments()

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      })
      // Show success message or toast
    } catch (error) {
      console.error("Error deleting comment:", error)
      setError("Failed to delete comment. Please try again.")
      toast({
        title: "Error",
        description: "Failed to delete your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle liking or disliking a comment
  const handleLike = async (commentId: number, isLike: number) => {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    try {
      // Optimistically update UI
      setCommentLikes((prev) => {
        const currentLike = prev[commentId]?.userLike

        // Calculate new like counts based on user's previous action and new action
        let newLikes = prev[commentId]?.likes || 0
        let newDislikes = prev[commentId]?.dislikes || 0

        // If user is changing their vote
        if (currentLike !== null) {
          // Remove previous vote
          if (currentLike === 1) newLikes--
          if (currentLike === -1) newDislikes--
        }

        // Add new vote if not canceling
        if (isLike !== 0) {
          if (isLike === 1) newLikes++
          if (isLike === -1) newDislikes++
        }

        return {
          ...prev,
          [commentId]: {
            likes: newLikes,
            dislikes: newDislikes,
            userLike: isLike === currentLike ? null : isLike, // Toggle if same value
          },
        }
      })

      // Send request to server
      await likeComment(bookId, commentId, isLike)

      // Refresh like counts after a short delay to ensure server has processed
      setTimeout(async () => {
        try {
          const likeData = await getCommentLikes(bookId, commentId)
          setCommentLikes((prev) => ({
            ...prev,
            [commentId]: {
              ...prev[commentId],
              likes: likeData.likes_count || 0,
              dislikes: likeData.dislikes_count || 0,
            },
          }))
        } catch (error) {
          console.error(`Error refreshing likes for comment ${commentId}:`, error)
        }
      }, 500)
      toast({
        title: isLike === 1 ? "Liked" : "Disliked",
        description: `You have ${isLike === 1 ? "liked" : "disliked"} this comment.`,
      })
    } catch (error) {
      console.error("Error liking/disliking comment:", error)

      // Revert optimistic update on error
      const likeData = await getCommentLikes(bookId, commentId)
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: {
          likes: likeData.likes_count || 0,
          dislikes: likeData.dislikes_count || 0,
          userLike: prev[commentId]?.userLike || null,
        },
      }))
      toast({
        title: "Error",
        description: "Failed to process your reaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Start replying to a comment
  const startReply = (commentId: number) => {
    setReplyingTo(commentId)
    setReplyContent("")

    // Focus the reply input after it renders
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus()
      }
    }, 100)
  }

  // Cancel replying
  const cancelReply = () => {
    setReplyingTo(null)
    setReplyContent("")
  }

  // Render a comment
  const renderComment = (comment: any, isReply = false) => {
    const commentId = comment.comment_id
    const likes = commentLikes[commentId]?.likes || 0
    const dislikes = commentLikes[commentId]?.dislikes || 0
    const userLike = commentLikes[commentId]?.userLike
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedReplies[commentId]
    const isCurrentUserComment = user && comment.user && user.id === comment.user.id
    const formattedDate = formatDate(comment.created_at)

    // Đảm bảo hiển thị đúng tên người dùng
    const username = comment.user?.username || "Anonymous"

    return (
      <div key={commentId} className={`${isReply ? "ml-8 mt-4" : "mt-6"} space-y-2`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{username}</span>
                <span className="ml-2 text-xs text-muted-foreground">{formattedDate}</span>
              </div>

              {isCurrentUserComment && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDeleteComment(commentId)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>

            <p className="text-sm">{comment.content}</p>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${userLike === 1 ? "text-green-600" : ""}`}
                  onClick={() => handleLike(commentId, userLike === 1 ? 0 : 1)}
                  disabled={!isLoggedIn}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="sr-only">Like</span>
                </Button>
                <span className="text-xs">{likes}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${userLike === -1 ? "text-red-600" : ""}`}
                  onClick={() => handleLike(commentId, userLike === -1 ? 0 : -1)}
                  disabled={!isLoggedIn}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="sr-only">Dislike</span>
                </Button>
                <span className="text-xs">{dislikes}</span>
              </div>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => startReply(commentId)}
                  disabled={!isLoggedIn}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </div>
          </div>
        </div>

        {replyingTo === commentId && (
          <div className="ml-11 mt-2">
            <Textarea
              ref={replyInputRef}
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelReply}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleReply(commentId)} disabled={!replyContent.trim() || loading}>
                Reply
              </Button>
            </div>
          </div>
        )}

        {!isReply && (
          <>
            {hasReplies && isExpanded && (
              <div className="space-y-4 pt-2">{comment.replies.map((reply: any) => renderComment(reply, true))}</div>
            )}

            {!isExpanded && comment.replies && comment.replies.length > 0 && (
              <Button variant="ghost" size="sm" className="ml-11 text-xs" onClick={() => toggleReplies(commentId)}>
                Show {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </Button>
            )}

            {isExpanded && comment.replies && comment.replies.length > 0 && (
              <Button variant="ghost" size="sm" className="ml-11 text-xs" onClick={() => toggleReplies(commentId)}>
                Hide replies
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Nút làm mới comments */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={refreshComments} disabled={refreshing} className="mb-4">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Comments"}
        </Button>
      </div>

      {isLoggedIn ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!newComment.trim() || loading}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Please{" "}
            <a href="/login" className="font-medium underline">
              log in
            </a>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-4">
          <Separator />
          <h3 className="text-lg font-semibold">
            {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
          </h3>
          <div>{comments.map((comment) => renderComment(comment))}</div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}
