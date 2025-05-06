export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

export async function isValidToken() {
  // Replace this with your actual token validation logic
  // For example, you can make an API call to check if the token is valid
  // and return true or false accordingly.
  // This is a placeholder implementation that always returns true.
  return true
}
