"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import {
  supabase,
  type UserProfile,
  verifyUserPin,
  getUserCredentialsForPin,
  getUserProfileById,
  type AuthError,
  AuthErrorType,
} from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { getEnv } from "@/lib/env"
import { useTheme } from "next-themes"

// Get the app URL from environment variables
const appUrl = getEnv("NEXT_PUBLIC_APP_URL", typeof window !== "undefined" ? window.location.origin : "")

interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string
  theme_mode?: string
  theme_color?: string
}

interface AuthResult {
  success: boolean
  error?: AuthError
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLocked: boolean
  userProfiles: UserProfile[]
  profilesLoading: boolean
  fetchUserProfiles: () => Promise<void>
  updateUserImage: (imageUrl: string | null) => void
  login: (email: string, password: string) => Promise<AuthResult>
  loginWithPin: (userId: string, pin: string) => Promise<AuthResult>
  loginAsManager: (userId: string, password: string) => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
  unlockWithPin: (pin: string) => Promise<AuthResult>
  lockScreen: () => void
  logout: () => void
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  // Fetch user profiles from Supabase
  const fetchUserProfiles = useCallback(async () => {
    try {
      setProfilesLoading(true)
      const { data, error } = await supabase.from("profiles").select("*").order("full_name")

      if (error) throw error

      if (data) {
        // Ensure we have the correct image field for each profile
        const profilesWithImages = data.map((profile) => ({
          ...profile,
          // Make sure we have a consistent image field
          image: profile.image || profile.avatar_url || null,
        }))
        setUserProfiles(profilesWithImages as UserProfile[])
      }
    } catch (error) {
      console.error("Error fetching user profiles:", error)
    } finally {
      setProfilesLoading(false)
    }
  }, [])

  // Initialize auth state and set up real-time subscriptions
  const initializeAuth = async () => {
    setIsLoading(true)

    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Get user profile from profiles table
        const result = await getUserProfileById(session.user.id)

        if (result.success && result.profile) {
          setUser({
            id: session.user.id,
            name: result.profile.full_name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            role: result.profile.role,
            image: result.profile.image || undefined,
            theme_mode: result.profile.theme_mode || undefined,
            theme_color: result.profile.theme_color || "black", // Default to black
          })

          // Apply the user's theme preference if available
          if (result.profile.theme_mode) {
            setTheme(result.profile.theme_mode)
          }
        }
      }

      // Fetch all user profiles for Quick Access
      await fetchUserProfiles()
    } catch (error) {
      console.error("Auth initialization error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeAuth()

    // Set up auth state change listener
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          // Get user profile from profiles table
          const result = await getUserProfileById(session.user.id)

          if (result.success && result.profile) {
            setUser({
              id: session.user.id,
              name: result.profile.full_name || session.user.email?.split("@")[0] || "User",
              email: session.user.email || "",
              role: result.profile.role,
              image: result.profile.image || undefined,
              theme_mode: result.profile.theme_mode || undefined,
              theme_color: result.profile.theme_color || "black", // Default to black
            })

            // Apply the user's theme preference if available
            if (result.profile.theme_mode) {
              setTheme(result.profile.theme_mode)
            }
          }

          // Refresh user profiles
          await fetchUserProfiles()
        } catch (error) {
          console.error("Error setting user after sign in:", error)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    // Set up real-time subscription to profiles table
    const profilesSubscription = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          // Refresh profiles when any change occurs
          fetchUserProfiles()
        },
      )
      .subscribe()

    return () => {
      authSubscription.unsubscribe()
      profilesSubscription.unsubscribe()
    }
  }, [fetchUserProfiles, setTheme])

  // Standard email/password login
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return {
          success: false,
          error: {
            type: AuthErrorType.SUPABASE_NOT_CONFIGURED,
            message: "Authentication is not available. Please configure Supabase environment variables.",
          },
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: {
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: "Invalid email or password. Please try again.",
            details: error,
          },
        }
      }

      return { success: !!data.user }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: {
          type: AuthErrorType.NETWORK_ERROR,
          message: "Network error. Please check your connection and try again.",
          details: error,
        },
      }
    } finally {
      setIsLoading(false)
    }
  }

  // PIN-based login for Front Desk and Technician roles
  const loginWithPin = async (userId: string, pin: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)
      console.log(`Attempting PIN login for user ${userId}`)

      // Get user credentials based on PIN
      const credentialsResult = await getUserCredentialsForPin(userId, pin)
      if (!credentialsResult.success || !credentialsResult.credentials) {
        return {
          success: false,
          error: credentialsResult.error,
        }
      }

      // For debugging purposes, log the credentials (email only, not password)
      console.log(`Retrieved credentials for email: ${credentialsResult.credentials.email}`)

      // Sign in with email/password
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentialsResult.credentials.email,
          password: credentialsResult.credentials.password,
        })

        if (error) {
          console.error("Auth error during PIN login:", error)
          return {
            success: false,
            error: {
              type: AuthErrorType.INVALID_CREDENTIALS,
              message:
                "Authentication failed. The stored credentials may be invalid. Please contact your administrator.",
              details: error,
            },
          }
        }

        setIsLocked(false)
        return { success: !!data.user }
      } catch (signInError) {
        console.error("Exception during PIN login:", signInError)
        return {
          success: false,
          error: {
            type: AuthErrorType.UNKNOWN_ERROR,
            message: "An unexpected error occurred during authentication. Please try again or contact support.",
            details: signInError,
          },
        }
      }
    } catch (error) {
      console.error("PIN login error:", error)
      return {
        success: false,
        error: {
          type: AuthErrorType.UNKNOWN_ERROR,
          message: "An unexpected error occurred. Please try again or contact support.",
          details: error,
        },
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Password-only login for Manager role
  const loginAsManager = async (userId: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)

      // Find the user profile
      const profileResult = await getUserProfileById(userId)
      if (!profileResult.success || !profileResult.profile) {
        return {
          success: false,
          error: profileResult.error,
        }
      }

      const userProfile = profileResult.profile

      // Verify if the role is Manager
      if (userProfile.role !== "Manager") {
        return {
          success: false,
          error: {
            type: AuthErrorType.INVALID_ROLE,
            message: "This login method is only for Managers.",
          },
        }
      }

      // Sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password,
      })

      if (error) {
        console.error("Auth error during manager login:", error)
        return {
          success: false,
          error: {
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: "Invalid password. Please try again.",
            details: error,
          },
        }
      }

      setIsLocked(false)
      return { success: !!data.user }
    } catch (error) {
      console.error("Manager login error:", error)
      return {
        success: false,
        error: {
          type: AuthErrorType.NETWORK_ERROR,
          message: "Network error. Please check your connection and try again.",
          details: error,
        },
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Password reset
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return {
          success: false,
          error: {
            type: AuthErrorType.SUPABASE_NOT_CONFIGURED,
            message: "Authentication is not available. Please configure Supabase environment variables.",
          },
        }
      }

      // Set the redirect URL to the reset password page
      // Use environment variable for the app URL if available
      const redirectTo = `${appUrl}/auth/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        return {
          success: false,
          error: {
            type: AuthErrorType.UNKNOWN_ERROR,
            message: "Failed to send reset link. Please try again.",
            details: error,
          },
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Password reset error:", error)
      return {
        success: false,
        error: {
          type: AuthErrorType.NETWORK_ERROR,
          message: "Network error. Please check your connection and try again.",
          details: error,
        },
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Unlock with PIN
  const unlockWithPin = async (pin: string): Promise<AuthResult> => {
    try {
      setIsLoading(true)

      if (!user) {
        return {
          success: false,
          error: {
            type: AuthErrorType.USER_NOT_FOUND,
            message: "No active user session. Please log in again.",
          },
        }
      }

      // Verify PIN
      const pinVerification = await verifyUserPin(user.id, pin)
      if (!pinVerification.success) {
        return {
          success: false,
          error: pinVerification.error,
        }
      }

      setIsLocked(false)
      return { success: true }
    } catch (error) {
      console.error("Unlock error:", error)
      return {
        success: false,
        error: {
          type: AuthErrorType.UNKNOWN_ERROR,
          message: "An unexpected error occurred. Please try again.",
          details: error,
        },
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Lock screen
  const lockScreen = () => {
    setIsLocked(true)
  }

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setIsLocked(false)
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Add a function to update the user's profile image in the context
  const updateUserImage = (imageUrl: string | null) => {
    setUser((prevUser) => {
      if (!prevUser) return null
      return {
        ...prevUser,
        image: imageUrl || undefined,
      }
    })
  }

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (!user?.id) return

    try {
      // Get user profile from profiles table
      const result = await getUserProfileById(user.id)

      if (result.success && result.profile) {
        setUser({
          id: user.id,
          name: result.profile.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          role: result.profile.role,
          // Use both image and avatar_url fields for compatibility
          image: result.profile.image || result.profile.avatar_url || undefined,
          theme_mode: result.profile.theme_mode || undefined,
          theme_color: result.profile.theme_color || "black", // Default to black
        })

        // Apply the user's theme preference if available
        if (result.profile.theme_mode) {
          setTheme(result.profile.theme_mode)
        }
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isLocked,
    userProfiles,
    profilesLoading,
    fetchUserProfiles,
    updateUserImage,
    login,
    loginWithPin,
    loginAsManager,
    resetPassword,
    unlockWithPin,
    lockScreen,
    logout,
    refreshUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
