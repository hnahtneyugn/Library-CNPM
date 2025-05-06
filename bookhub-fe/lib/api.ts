// This file contains all the API functions to interact with the FastAPI backend

// Base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Cache cho dữ liệu sách và categories
let booksCache: any[] = []
const categoriesCache: any[] = []
const authorsCache: any[] = []

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    // Thêm thông tin chi tiết về lỗi
    const errorText = await response.text()
    let errorDetail
    try {
      const errorJson = JSON.parse(errorText)
      errorDetail = errorJson.detail || "An error occurred while fetching data"
    } catch (e) {
      errorDetail = errorText || `HTTP error ${response.status}`
    }
    throw new Error(errorDetail)
  }
  return response.json()
}

// Helper function to get auth headers
export function getAuthHeaders() {
  // Get token from localStorage or cookie
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Get auth token from storage
export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

// Authentication functions
export async function login(credentials: { username: string; password: string }) {
  try {
    // Create FormData object for OAuth2 password flow
    const formData = new FormData()
    formData.append("username", credentials.username)
    formData.append("password", credentials.password)

    const response = await fetch(`${API_BASE_URL}/authentication/signin`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || "Login failed"
      } catch (e) {
        errorMessage = errorText || `HTTP error ${response.status}`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Kiểm tra xem có token không
    if (!data.access_token) {
      throw new Error("No access token received")
    }

    // Lưu token và username vào localStorage
    localStorage.setItem("auth_token", data.access_token)
    localStorage.setItem("username", credentials.username)

    return data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export async function register(userData: {
  username: string
  password: string
}) {
  try {
    console.log("Registering user:", userData.username)
    const response = await fetch(`${API_BASE_URL}/authentication/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetail
      try {
        const errorJson = JSON.parse(errorText)

        // Kiểm tra lỗi validation từ FastAPI
        if (Array.isArray(errorJson.detail)) {
          // Xử lý trường hợp lỗi validation từ FastAPI
          for (const err of errorJson.detail) {
            // Kiểm tra lỗi liên quan đến mật khẩu
            if (err.loc.includes("password") && err.type.includes("min_length")) {
              return Promise.reject(new Error("Mật khẩu cần ít nhất 8 ký tự"))
            }
            // Kiểm tra lỗi liên quan đến username
            if (err.loc.includes("username")) {
              return Promise.reject(new Error(err.msg))
            }
          }
          errorDetail = errorJson.detail.map((err: any) => `${err.loc.join(".")}: ${err.msg}`).join(", ")
        } else if (errorJson.detail) {
          errorDetail = errorJson.detail
        } else {
          errorDetail = "Registration failed"
        }
      } catch (e) {
        errorDetail = errorText || `HTTP error ${response.status}`
      }

      // Nếu không có lỗi cụ thể, kiểm tra độ dài mật khẩu
      if (userData.password.length < 8) {
        return Promise.reject(new Error("Mật khẩu cần ít nhất 8 ký tự"))
      }

      throw new Error(errorDetail)
    }

    return await response.json()
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

export async function getUserProfile() {
  try {
    const token = getAuthToken()
    if (!token) {
      return null
    }

    // Lấy username từ localStorage nếu có
    const username = localStorage.getItem("username")
    if (username) {
      return { username }
    }

    // Nếu không có username trong localStorage, lấy từ API
    const response = await fetch(`${API_BASE_URL}/authentication/users/me`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (response.status === 401) {
      // Token không hợp lệ hoặc hết hạn, xóa token
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("username")
      }
      return null
    }

    if (!response.ok) {
      console.error("Error fetching user profile:", response.status, response.statusText)
      return null
    }

    const userData = await response.json()
    console.log("User profile data from API:", userData)

    // Lưu username vào localStorage nếu có
    if (userData.username) {
      localStorage.setItem("username", userData.username)
    }

    return userData
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function isValidToken() {
  try {
    const token = getAuthToken()
    if (!token) {
      return false
    }

    const response = await fetch(`${API_BASE_URL}/authentication/users/me`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    return response.status === 200
  } catch (error) {
    console.error("Error validating token:", error)
    return false
  }
}

// Book functions
export async function fetchBooks(params?: {
  offset?: number
  limit?: number
  order_by?: string
  order?: string
  search?: string
}) {
  try {
    let url = `${API_BASE_URL}/books/`

    if (params) {
      const queryParams = new URLSearchParams()
      if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
      if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
      if (params.order_by) queryParams.append("order_by", params.order_by)
      if (params.order) queryParams.append("order", params.order)
      if (params.search) queryParams.append("search", params.search)

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }
    }

    console.log("Fetching books from:", url)
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    // Kiểm tra response trước khi xử lý
    if (!response.ok) {
      console.error("Error fetching books:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error details:", errorText)
      return [] // Trả về mảng rỗng thay vì throw error
    }

    const data = await response.json()
    console.log("Books data received:", data)

    // Cập nhật cache
    if (Array.isArray(data) && data.length > 0) {
      // Chỉ cập nhật cache nếu đang lấy tất cả sách (không có search)
      if (!params?.search) {
        booksCache = [
          ...booksCache,
          ...data.filter((book) => !booksCache.some((cachedBook) => cachedBook.work_key === book.work_key)),
        ]
      }

      // Trích xuất categories từ sách
      extractCategoriesFromBooks(data)

      // Trích xuất authors từ sách
      extractAuthorsFromBooks(data)
    }

    return data
  } catch (error) {
    console.error("Exception in fetchBooks:", error)
    return [] // Trả về mảng rỗng nếu có lỗi
  }
}

// Hàm trích xuất categories từ sách
function extractCategoriesFromBooks(books: any[]) {
  if (!Array.isArray(books)) return

  books.forEach((book) => {
    if (book.subjects && Array.isArray(book.subjects)) {
      book.subjects.forEach((subject: string) => {
        if (!subject) return

        // Kiểm tra xem category đã tồn tại trong cache chưa
        const existingCategory = categoriesCache.find((cat) => cat.name === subject)

        if (existingCategory) {
          existingCategory.book_count += 1
        } else {
          categoriesCache.push({
            name: subject,
            book_count: 1,
          })
        }
      })
    }
  })

  // Sắp xếp categories theo số lượng sách giảm dần
  categoriesCache.sort((a, b) => b.book_count - a.book_count)
}

// Hàm trích xuất authors từ sách
function extractAuthorsFromBooks(books: any[]) {
  if (!Array.isArray(books)) return

  books.forEach((book) => {
    if (book.author && book.author.key) {
      // Kiểm tra xem author đã tồn tại trong cache chưa
      const existingAuthor = authorsCache.find((author) => author.key === book.author.key)

      if (existingAuthor) {
        existingAuthor.work_count += 1
      } else {
        authorsCache.push({
          key: book.author.key,
          name: book.author.name || "Unknown Author",
          work_count: 1,
        })
      }
    }
  })
}

export async function fetchFeaturedBooks() {
  try {
    // Lấy sách nổi bật (sắp xếp theo views)
    return await fetchBooks({ limit: 4, order_by: "views", order: "desc" })
  } catch (error) {
    console.error("Error fetching featured books:", error)
    return [] // Trả về mảng rỗng nếu có lỗi
  }
}

export async function getBookById(workKey: string) {
  try {
    // Kiểm tra xem sách có trong cache không
    const cachedBook = booksCache.find((book) => book.work_key === workKey)
    if (cachedBook && cachedBook.isbn && cachedBook.publishers) {
      console.log("Book found in cache with full details:", cachedBook)
      return cachedBook
    }

    const response = await fetch(`${API_BASE_URL}/books/${workKey}`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      console.error("Error fetching book details:", response.status, response.statusText)
      return null
    }

    const bookData = await response.json()
    console.log("Book details from API:", bookData)

    // Thêm sách vào cache hoặc cập nhật nếu đã tồn tại
    if (bookData) {
      const existingBookIndex = booksCache.findIndex((book) => book.work_key === workKey)
      if (existingBookIndex >= 0) {
        // Cập nhật sách đã tồn tại trong cache
        booksCache[existingBookIndex] = {
          ...booksCache[existingBookIndex],
          ...bookData,
        }
      } else {
        // Thêm sách mới vào cache
        booksCache.push(bookData)
      }
    }

    return bookData
  } catch (error) {
    console.error("Exception in getBookById:", error)
    return null
  }
}

// Cập nhật hàm fetchCategories để sử dụng cache
export async function fetchCategories() {
  try {
    // Nếu đã có categories trong cache, trả về từ cache
    if (categoriesCache.length > 0) {
      console.log("Returning categories from cache:", categoriesCache.length)
      return categoriesCache
    }

    // Nếu chưa có, lấy sách và trích xuất categories
    const books = await fetchBooks({ limit: 100 })

    // Trích xuất categories từ sách (đã được thực hiện trong fetchBooks)

    return categoriesCache
  } catch (error) {
    console.error("Exception in fetchCategories:", error)
    return []
  }
}

export async function fetchBooksByCategory(subject: string, offset = 0, limit = 12) {
  try {
    const encodedSubject = encodeURIComponent(subject)
    // Sử dụng endpoint subjects để lấy sách theo chủ đề
    const url = `${API_BASE_URL}/subjects/${encodedSubject}?offset=${offset}&limit=${limit}`

    console.log("Fetching books by subject:", url)
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      console.error("Error fetching books by subject:", response.status, response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error("Exception in fetchBooksByCategory:", error)
    return []
  }
}

// Author functions
export async function getAuthorById(key: string) {
  try {
    // Kiểm tra xem author có trong cache không
    const cachedAuthor = authorsCache.find((author) => author.key === key)
    if (cachedAuthor) {
      console.log("Author found in cache:", cachedAuthor)
      return cachedAuthor
    }

    const response = await fetch(`${API_BASE_URL}/authors/${key}`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      console.error("Error fetching author details:", response.status, response.statusText)
      return null
    }

    const authorData = await response.json()

    // Thêm author vào cache
    if (authorData && !authorsCache.some((author) => author.key === key)) {
      authorsCache.push({
        ...authorData,
        work_count: authorData.work_count || 0,
      })
    }

    return authorData
  } catch (error) {
    console.error("Exception in getAuthorById:", error)
    return null
  }
}

export async function getAuthorBooks(key: string, offset = 0, limit = 12) {
  try {
    const response = await fetch(`${API_BASE_URL}/authors/${key}/books?offset=${offset}&limit=${limit}`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      console.error("Error fetching author books:", response.status, response.statusText)
      return []
    }
    return await response.json()
  } catch (error) {
    console.error("Exception in getAuthorBooks:", error)
    return []
  }
}

// Cập nhật hàm fetchAuthors để sử dụng cache
export async function fetchAuthors(params?: { offset?: number; limit?: number; search?: string }) {
  try {
    // Nếu đã có authors trong cache, trả về từ cache
    if (authorsCache.length > 0) {
      console.log("Returning authors from cache:", authorsCache.length)

      // Áp dụng limit nếu có
      if (params?.limit) {
        return authorsCache.slice(0, params.limit)
      }

      return authorsCache
    }

    // Nếu chưa có, lấy sách và trích xuất authors
    await fetchBooks({ limit: 100 })

    // Trích xuất authors từ sách (đã được thực hiện trong fetchBooks)

    // Áp dụng limit nếu có
    if (params?.limit) {
      return authorsCache.slice(0, params.limit)
    }

    return authorsCache
  } catch (error) {
    console.error("Exception in fetchAuthors:", error)
    return []
  }
}

// Rating functions
export async function submitBookReview(bookId: string, reviewData: { rating: number }) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to submit a review")
    }

    const response = await fetch(`${API_BASE_URL}/rating/${bookId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ score: reviewData.rating }),
    })
    return await handleResponse(response)
  } catch (error) {
    console.error("Exception in submitBookReview:", error)
    throw error
  }
}

export async function fetchBookReviews(bookId: string) {
  try {
    const url = `${API_BASE_URL}/rating/${bookId}/summary`
    console.log("Fetching book reviews from:", url)

    // Thực hiện request không có header xác thực
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Error fetching book reviews for ${bookId}: ${response.status} ${response.statusText}`)
      // Nếu lỗi, trả về dữ liệu mặc định (không random)
      return {
        average_score: 0,
        total_ratings: 0,
        summary: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        user_score: null,
      }
    }

    // Parse và trả về dữ liệu
    const data = await response.json()
    console.log(`Reviews data for book ${bookId}:`, data)
    return data
  } catch (error) {
    console.error("Exception in fetchBookReviews:", error)
    // Nếu có lỗi, trả về dữ liệu mặc định (không random)
    return {
      average_score: 0,
      total_ratings: 0,
      summary: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      user_score: null,
    }
  }
}

export async function deleteBookReview(bookId: string) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to delete a review")
    }

    const response = await fetch(`${API_BASE_URL}/rating/${bookId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    })
    return await handleResponse(response)
  } catch (error) {
    console.error("Exception in deleteBookReview:", error)
    throw error
  }
}

// Comment functions
export async function fetchBookComments(bookId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/comment/${bookId}`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (response.status === 401) {
      console.warn("Unauthorized when fetching book comments. This might be expected if not logged in.")
      return []
    }

    if (!response.ok) {
      console.error("Error fetching book comments:", response.status, response.statusText)
      return []
    }

    const comments = await response.json()
    console.log("Raw comments data:", comments)

    // Đảm bảo mỗi comment có thông tin user đầy đủ
    if (Array.isArray(comments)) {
      return comments.map((comment) => {
        // Chỉ gán Anonymous khi hoàn toàn không có thông tin user
        if (!comment.user || typeof comment.user !== 'object') {
          return {
            ...comment,
            user: { id: null, username: "Anonymous" },
          }
        }
        return comment
      })
    }

    return comments
  } catch (error) {
    console.error("Exception in fetchBookComments:", error)
    return []
  }
}

export async function submitBookComment(bookId: string, commentData: { content: string }) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to submit a comment")
    }

    const response = await fetch(`${API_BASE_URL}/comment/${bookId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(commentData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error submitting comment:", errorText)
      throw new Error("Failed to submit comment")
    }

    const result = await response.json()
    console.log("Comment submission result:", result)
    return result
  } catch (error) {
    console.error("Exception in submitBookComment:", error)
    throw error
  }
}

export async function replyToComment(bookId: string, commentId: number, replyData: { content: string }) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to reply to a comment")
    }

    const response = await fetch(`${API_BASE_URL}/comment/${commentId}/replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(replyData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error submitting reply:", errorText)
      throw new Error("Failed to submit reply")
    }

    const result = await response.json()
    console.log("Reply submission result:", result)
    return result
  } catch (error) {
    console.error("Exception in replyToComment:", error)
    throw error
  }
}

export async function fetchCommentReplies(bookId: string, commentId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/comment/${commentId}/replies`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (response.status === 401) {
      console.warn("Unauthorized when fetching comment replies. This might be expected if not logged in.")
      return []
    }

    if (!response.ok) {
      console.error("Error fetching comment replies:", response.status, response.statusText)
      return []
    }

    const replies = await response.json()
    console.log(`Raw replies for comment ${commentId}:`, replies)

    // Đảm bảo mỗi reply có thông tin user đầy đủ
    if (Array.isArray(replies)) {
      return replies.map((reply) => {
        // Kiểm tra và đảm bảo thông tin user
        if (!reply.user) {
          return {
            ...reply,
            user: { id: null, username: "Anonymous" },
          }
        } else if (!reply.user.username) {
          return {
            ...reply,
            user: { ...reply.user, username: "Anonymous" },
          }
        }
        return reply
      })
    }

    return replies
  } catch (error) {
    console.error("Exception in fetchCommentReplies:", error)
    return []
  }
}

export async function deleteComment(bookId: string, commentId: number) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to delete a comment")
    }

    const response = await fetch(`${API_BASE_URL}/comment/${commentId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    })
    return await handleResponse(response)
  } catch (error) {
    console.error("Exception in deleteComment:", error)
    throw error
  }
}

export async function likeComment(bookId: string, commentId: number, isLike: number) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to like a comment")
    }

    console.log(`Sending like request for comment ${commentId} with value ${isLike}`)
    const response = await fetch(`${API_BASE_URL}/comment/${commentId}/like?is_like=${isLike}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      console.error(`Error liking comment ${commentId}:`, response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error details:", errorText)
      throw new Error(`Failed to like comment: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Exception in likeComment:", error)
    throw error
  }
}

export async function getCommentLikes(bookId: string, commentId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/comment/${commentId}/like`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (response.status === 401) {
      console.warn("Unauthorized when fetching comment likes. This might be expected if not logged in.")
      return { likes_count: 0, dislikes_count: 0 }
    }

    if (!response.ok) {
      console.error("Error fetching comment likes:", response.status, response.statusText)
      return { likes_count: 0, dislikes_count: 0 }
    }
    return await response.json()
  } catch (error) {
    console.error("Exception in getCommentLikes:", error)
    return { likes_count: 0, dislikes_count: 0 }
  }
}

// Favorites functions
export async function getFavoriteBooks() {
  try {
    const token = getAuthToken()
    if (!token) {
      console.warn("No auth token found when fetching favorite books")
      return { favorite_books: [] }
    }

    const response = await fetch(`${API_BASE_URL}/favourite/favorites`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (response.status === 401) {
      console.warn("Unauthorized when fetching favorite books. This might be expected if not logged in.")
      return { favorite_books: [] }
    }

    if (!response.ok) {
      console.error("Error fetching favorite books:", response.status, response.statusText)
      return { favorite_books: [] }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Exception in getFavoriteBooks:", error)
    return { favorite_books: [] }
  }
}

export async function addBookToFavorites(bookId: string) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to add a book to favorites")
    }

    const response = await fetch(`${API_BASE_URL}/favourite/favorites/${bookId}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    })
    return await handleResponse(response)
  } catch (error) {
    console.error("Exception in addBookToFavorites:", error)
    throw error
  }
}

export async function removeBookFromFavorites(bookId: string) {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication required to remove a book from favorites")
    }

    const response = await fetch(`${API_BASE_URL}/favourite/favorites/${bookId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    })
    return await handleResponse(response)
  } catch (error) {
    console.error("Exception in removeBookFromFavorites:", error)
    throw error
  }
}

export async function checkBookIsFavorite(bookId: string) {
  try {
    const token = getAuthToken()
    if (!token) {
      return false
    }

    const favorites = await getFavoriteBooks()
    if (favorites && Array.isArray(favorites.favorite_books)) {
      return favorites.favorite_books.some((book: any) => book.work_key === bookId)
    }
    return false
  } catch (error) {
    console.error("Exception in checkBookIsFavorite:", error)
    return false
  }
}

// Recommendation functions
export async function fetchRecommendations(limit = 10) {
  try {
    const token = getAuthToken()
    if (!token) {
      console.warn("No auth token found when fetching recommendations")
      return []
    }

    const response = await fetch(`${API_BASE_URL}/recommendations/?limit=${limit}`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (response.status === 401) {
      console.warn("Unauthorized when fetching recommendations. This might be expected if not logged in.")
      return []
    }

    if (!response.ok) {
      console.error("Error fetching recommendations:", response.status, response.statusText)
      return []
    }
    return await response.json()
  } catch (error) {
    console.error("Exception in fetchRecommendations:", error)
    return []
  }
}

// Cập nhật hàm getBookCoverUrl để sử dụng cover_id đúng cách
export function getBookCoverUrl(coverId: number | null, size: "S" | "M" | "L" = "M") {
  if (!coverId) {
    return "/placeholder.svg?height=300&width=200"
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

// Hàm mới để định dạng ngày tháng
export function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }

    // Định dạng ngày tháng: DD/MM/YYYY HH:MM
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

// Dữ liệu mẫu cho rating
const sampleRatings: Record<string, { average_score: number; total_ratings: number }> = {
  // Thêm một số dữ liệu mẫu cho các sách phổ biến
  OL45804W: { average_score: 4.5, total_ratings: 120 },
  OL82563W: { average_score: 3.8, total_ratings: 85 },
  OL27448W: { average_score: 4.2, total_ratings: 67 },
  OL103123W: { average_score: 3.5, total_ratings: 42 },
  // Thêm dữ liệu mẫu cho các sách khác nếu cần
}

// Sửa đổi hàm fetchBookReviews để sử dụng dữ liệu mẫu
