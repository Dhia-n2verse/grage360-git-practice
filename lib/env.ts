/**
 * Environment variables validation utility
 */

// Function to validate required environment variables
export function validateEnv() {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(", ")}`)
    console.warn("Authentication features will be limited. The app will run in demo mode.")
    return false
  }

  return true
}

// Function to get a validated environment variable
export function getEnv(key: string, defaultValue = ""): string {
  const value = process.env[key]
  if (!value) {
    console.warn(`Warning: Environment variable ${key} is not set. Using default value.`)
    return defaultValue
  }
  return value
}

// Add a function to get the app name
export function getAppName(): string {
  return getEnv("NEXT_PUBLIC_APP_NAME", "iGarage360")
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "iGarage360",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""),
}
