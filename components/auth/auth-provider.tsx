"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient, getCurrentUser, clearAuthToken, handleApiError } from "@/lib/api"
import type { User, AuthContextType } from "@/lib/auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = getCurrentUser()
        if (storedUser) {
          // Verify token is still valid by fetching current user
          const currentUser = await apiClient.getCurrentUser()
          setUser(currentUser)
        }
      } catch (err) {
        // Token is invalid, clear it
        clearAuthToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const response = await apiClient.login({ email, password })
      setUser(response.user)
      return true
    } catch (err) {
      setError(handleApiError(err))
      return false
    }
  }

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      setError(null)
      const response = await apiClient.register({
        email,
        password,
        full_name: fullName,
      })
      setUser(response.user)
      return true
    } catch (err) {
      setError(handleApiError(err))
      return false
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
    router.push("/login")
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
