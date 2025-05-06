"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { BookOpen, Menu, Search, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getAuthToken, getUserProfile } from "@/lib/api"
import { useRouter } from "next/navigation"

export function Header() {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Kiểm tra nếu người dùng đã đăng nhập
    const token = getAuthToken()
    setIsLoggedIn(!!token)

    // Nếu đã đăng nhập, lấy tên người dùng từ hồ sơ
    if (token) {
      const getProfile = async () => {
        try {
          const data = await getUserProfile()
          if (data) {
            console.log("User profile data:", data)
            setUsername(data.username || "User")
          } else {
            // Nếu không lấy được dữ liệu người dùng, xóa token
            localStorage.removeItem("auth_token")
            setIsLoggedIn(false)
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err)
          // Nếu token không hợp lệ, xóa token và đặt lại trạng thái
          if (err instanceof Error && (err.message.includes("401") || err.message.includes("unauthorized"))) {
            localStorage.removeItem("auth_token")
            setIsLoggedIn(false)
          }
        }
      }

      getProfile()
    }
  }, [])

  const handleLogout = () => {
    // Clear token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }

    // Update state
    setIsLoggedIn(false)
    setUsername("")

    // Refresh the page
    window.location.href = "/"
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6 max-w-7xl">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-6 w-6" />
                <span>BOOKHUB</span>
              </Link>
              <Link href="/books" className="text-sm font-medium transition-colors hover:text-primary">
                Books
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/profile" className="text-sm font-medium transition-colors hover:text-primary">
                    My Profile
                  </Link>
                  <Link href="/favorites" className="text-sm font-medium transition-colors hover:text-primary">
                    My Favorites
                  </Link>
                  <Button variant="outline" className="mt-4" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-4">
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 mr-6">
          <BookOpen className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">BOOKHUB</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="/books" className="font-medium transition-colors hover:text-primary">
            Books
          </Link>
        </nav>
        <div className="flex items-center ml-auto gap-2">
          <div className={cn("flex items-center", isSearchOpen ? "flex" : "hidden md:flex")}>
            {isSearchOpen && (
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close search</span>
              </Button>
            )}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] pl-8 md:w-[200px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          {!isSearchOpen && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Open search</span>
            </Button>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <span className="hidden md:inline-block text-sm">{username}</span>
              <Button variant="ghost" className="hidden md:flex" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
