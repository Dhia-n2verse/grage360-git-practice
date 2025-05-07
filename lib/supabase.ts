// Add additional error handling and logging to the Supabase client initialization
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { env } from "@/lib/env"

// Validate environment variables
if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Create Supabase client with error handling
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL || "",
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: "public",
    },
  },
)

// Add a helper function to check if Supabase is properly initialized
export function isSupabaseInitialized(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Log Supabase initialization status
console.log("Supabase client initialized:", isSupabaseInitialized())

// Type definitions for our user profiles
export interface UserProfile {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  role: "Manager" | "Technician" | "Front Desk"
  image?: string | null
  avatar_url?: string | null
  phone?: string | null
  address?: string | null
  created_at?: string
  updated_at?: string
  specialties?: Array<{
    id: string
    name: string
    description?: string | null
  }>
}

// Define specific error types for better error handling
export enum AuthErrorType {
  INVALID_PIN = "INVALID_PIN",
  PIN_NOT_FOUND = "PIN_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INVALID_ROLE = "INVALID_ROLE",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  SUPABASE_NOT_CONFIGURED = "SUPABASE_NOT_CONFIGURED",
}

export interface AuthError {
  type: AuthErrorType
  message: string
  details?: any
}

// Helper function to get user role from profile
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single()

    if (error) throw error
    return data?.role || "user"
  } catch (error) {
    console.error("Error getting user role:", error)
    return "user"
  }
}

// Check if a user profile exists
export const checkUserExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (error) return false
    return !!data
  } catch (error) {
    console.error("Error checking user existence:", error)
    return false
  }
}

// Get user profile by ID
export const getUserProfileById = async (
  userId: string,
): Promise<{ success: boolean; profile?: UserProfile; error?: AuthError }> => {
  try {
    // Check if Supabase is configured
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: {
          type: AuthErrorType.SUPABASE_NOT_CONFIGURED,
          message: "Authentication is not available. Please configure Supabase environment variables.",
        },
      }
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      return {
        success: false,
        error: {
          type: AuthErrorType.USER_NOT_FOUND,
          message: "User profile not found.",
          details: error,
        },
      }
    }

    return {
      success: true,
      profile: data as UserProfile,
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return {
      success: false,
      error: {
        type: AuthErrorType.NETWORK_ERROR,
        message: "Network error. Please check your connection and try again.",
        details: error,
      },
    }
  }
}

export const verifyUserPin = async (userId: string, pin: string): Promise<{ success: boolean; error?: AuthError }> => {
  try {
    const { data, error } = await supabase.from("user_pins").select("id").eq("user_id", userId).eq("pin", pin).single()

    if (error) {
      return {
        success: false,
        error: {
          type: AuthErrorType.INVALID_PIN,
          message: "Invalid PIN. Please try again.",
          details: error,
        },
      }
    }

    if (!data) {
      return {
        success: false,
        error: {
          type: AuthErrorType.PIN_NOT_FOUND,
          message: "PIN not found for this user.",
        },
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying PIN:", error)
    return {
      success: false,
      error: {
        type: AuthErrorType.NETWORK_ERROR,
        message: "Network error. Please check your connection and try again.",
        details: error,
      },
    }
  }
}

export const getUserCredentialsForPin = async (
  userId: string,
  pin: string,
): Promise<{ success: boolean; credentials?: { email: string; password: string }; error?: AuthError }> => {
  try {
    const { data, error } = await supabase
      .from("user_pins")
      .select("password_hash")
      .eq("user_id", userId)
      .eq("pin", pin)
      .single()

    if (error) {
      return {
        success: false,
        error: {
          type: AuthErrorType.INVALID_PIN,
          message: "Invalid PIN. Please try again.",
          details: error,
        },
      }
    }

    if (!data) {
      return {
        success: false,
        error: {
          type: AuthErrorType.PIN_NOT_FOUND,
          message: "PIN not found for this user.",
        },
      }
    }

    // Fetch user profile to get the email
    const profileResult = await getUserProfileById(userId)
    if (!profileResult.success || !profileResult.profile) {
      return {
        success: false,
        error: profileResult.error,
      }
    }

    return {
      success: true,
      credentials: {
        email: profileResult.profile.email,
        password: data.password_hash, // Use the stored password hash
      },
    }
  } catch (error) {
    console.error("Error getting credentials for PIN:", error)
    return {
      success: false,
      error: {
        type: AuthErrorType.NETWORK_ERROR,
        message: "Network error. Please check your connection and try again.",
        details: error,
      },
    }
  }
}
