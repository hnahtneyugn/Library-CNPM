"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { getAuthToken } from "@/lib/api"

export default function TestConnection() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useState<{ [key: string]: "loading" | "success" | "error" }>({
    // Endpoint cơ bản không yêu cầu xác thực (nhưng theo Swagger, tất cả đều yêu cầu xác thực)
    "books/?limit=1": "loading",
    "authors/OL23919A": "loading", // Sử dụng một ID tác giả cụ thể
    "subjects/fiction": "loading",
    "rating/OL45804W/summary": "loading", // Sử dụng một ID sách cụ thể
    "comment/OL45804W": "loading", // Sử dụng một ID sách cụ thể

    // Endpoint yêu cầu xác thực
    "authentication/users/me": "loading",
    "favourite/favorites": "loading",
    "recommendations/": "loading",
  })
  const [endpointMessages, setEndpointMessages] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const token = getAuthToken()
    setIsLoggedIn(!!token)

    // Hiển thị API URL từ biến môi trường
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "Not configured"
    setApiUrl(apiBaseUrl)

    // Kiểm tra kết nối cơ bản
    const testBasicConnection = async () => {
      try {
        // Kiểm tra xem API_BASE_URL có được cấu hình không
        if (!apiBaseUrl || apiBaseUrl === "Not configured") {
          setStatus("error")
          setMessage("API_BASE_URL chưa được cấu hình. Vui lòng kiểm tra file .env.local")
          return
        }

        // Kiểm tra kết nối mạng cơ bản
        const testUrl = `${apiBaseUrl}/books/?limit=1`
        console.log("Testing connection to:", testUrl)

        const headers: HeadersInit = {}
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(testUrl, { headers })
        console.log("Response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          setStatus("success")
          setMessage(`Kết nối thành công! Nhận được ${Array.isArray(data) ? data.length : "không phải mảng"} sách.`)
        } else {
          setStatus("error")
          setMessage(`Lỗi HTTP: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error("Connection test error:", error)
        setStatus("error")
        setNetworkError(error instanceof Error ? error.message : String(error))
        setMessage(`Lỗi kết nối: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Kiểm tra từng endpoint
    const testEndpoint = async (endpoint: string) => {
      try {
        if (!apiBaseUrl || apiBaseUrl === "Not configured") {
          setEndpoints((prev) => ({ ...prev, [endpoint]: "error" }))
          setEndpointMessages((prev) => ({ ...prev, [endpoint]: "API_BASE_URL chưa được cấu hình" }))
          return
        }

        const headers: HeadersInit = {}
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const testUrl = `${apiBaseUrl}/${endpoint}`
        console.log(`Testing endpoint: ${testUrl}`)

        const response = await fetch(testUrl, { headers })
        console.log(`Endpoint ${endpoint} response:`, response.status)

        if (response.ok) {
          setEndpoints((prev) => ({ ...prev, [endpoint]: "success" }))
          setEndpointMessages((prev) => ({ ...prev, [endpoint]: "Kết nối thành công" }))
        } else {
          setEndpoints((prev) => ({ ...prev, [endpoint]: "error" }))
          setEndpointMessages((prev) => ({
            ...prev,
            [endpoint]: `Lỗi HTTP: ${response.status} ${response.statusText}`,
          }))
        }
      } catch (error) {
        console.error(`Error testing endpoint ${endpoint}:`, error)
        setEndpoints((prev) => ({ ...prev, [endpoint]: "error" }))
        setEndpointMessages((prev) => ({
          ...prev,
          [endpoint]: `Lỗi kết nối: ${error instanceof Error ? error.message : String(error)}`,
        }))
      }
    }

    testBasicConnection()

    // Kiểm tra tất cả các endpoint
    Object.keys(endpoints).forEach((endpoint) => {
      testEndpoint(endpoint)
    })
  }, [])

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Kiểm tra kết nối Backend</h1>

      <div className="mb-4 space-y-2">
        <p>
          <strong>API URL:</strong> {apiUrl}
        </p>
        <p>
          <strong>Trạng thái đăng nhập:</strong> {isLoggedIn ? "Đã đăng nhập" : "Chưa đăng nhập"}
          {!isLoggedIn && (
            <span className="text-yellow-600 ml-2">
              (Theo Swagger UI, tất cả các endpoint đều yêu cầu xác thực OAuth2PasswordBearer)
            </span>
          )}
        </p>
      </div>

      {status === "loading" && <p>Đang kiểm tra kết nối...</p>}

      {status === "success" && (
        <Alert className="bg-green-50 border-green-500 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Thành công</AlertTitle>
          <AlertDescription className="text-green-600">{message}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {message}
            {networkError && (
              <div className="mt-2">
                <p className="font-semibold">Chi tiết lỗi mạng:</p>
                <p className="text-sm">{networkError}</p>
                <p className="mt-2 text-sm">Lỗi này thường xảy ra khi:</p>
                <ul className="list-disc pl-5 text-sm">
                  <li>Backend chưa được khởi động</li>
                  <li>URL backend không chính xác</li>
                  <li>CORS chưa được cấu hình đúng trên backend</li>
                  <li>Có vấn đề về mạng giữa frontend và backend</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <h2 className="text-xl font-bold mb-4">Kiểm tra các Endpoint</h2>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Tất cả các Endpoint (yêu cầu xác thực)</h3>
        {Object.keys(endpoints).map((endpoint) => (
          <div key={endpoint} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">/{endpoint}</h3>
              {!isLoggedIn ? (
                <span className="text-yellow-600">Cần đăng nhập</span>
              ) : (
                <>
                  {endpoints[endpoint] === "loading" && <span className="text-blue-500">Đang kiểm tra...</span>}
                  {endpoints[endpoint] === "success" && <span className="text-green-500">Thành công</span>}
                  {endpoints[endpoint] === "error" && <span className="text-red-500">Lỗi</span>}
                </>
              )}
            </div>
            {endpointMessages[endpoint] && (
              <p
                className={`text-sm mt-1 ${
                  endpoints[endpoint] === "success"
                    ? "text-green-600"
                    : endpoints[endpoint] === "error"
                      ? "text-red-500"
                      : ""
                }`}
              >
                {endpointMessages[endpoint]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>Kiểm tra lại</Button>
          {!isLoggedIn && (
            <Button variant="outline" asChild>
              <a href="/login">Đăng nhập để kiểm tra đầy đủ</a>
            </Button>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Thông tin debug</h3>
          <p className="text-sm">
            Biến môi trường NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || "Không được đặt"}
          </p>
          <p className="text-sm mt-2">Nếu bạn gặp vấn đề với kết nối, hãy kiểm tra:</p>
          <ol className="list-decimal pl-5 text-sm mt-1 space-y-1">
            <li>
              File <code>.env.local</code> có tồn tại và chứa biến <code>NEXT_PUBLIC_API_URL</code>
            </li>
            <li>Backend đang chạy và có thể truy cập được từ frontend</li>
            <li>CORS đã được cấu hình đúng trên backend</li>
            <li>Không có tường lửa hoặc proxy chặn kết nối</li>
            <li>
              <strong>Quan trọng:</strong> Theo Swagger UI, tất cả các endpoint đều yêu cầu xác thực
              OAuth2PasswordBearer
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
