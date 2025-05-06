"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Chỉ render theme sau khi component đã mount trên client
  // Điều này ngăn chặn hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Nếu chưa mount, render children mà không có theme
  // Điều này đảm bảo HTML ban đầu khớp với server
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
