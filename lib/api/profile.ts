import { supabase } from "@/lib/supabase"
import { formatFullName } from "@/lib/utils"

export interface ProfileUpdateData {
  first_name?: string
  last_name?: string
  full_name?: string
  phone?: string
  address?: string
  avatar_url?: string | null
  image?: string | null
  theme_mode?: string | null
  theme_color?: string | null
}

// Get user profile by ID
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return { success: false, error }
  }
}

// Update user profile
export async function updateUserProfile(userId: string, profileData: ProfileUpdateData) {
  try {
    // If first_name or last_name is provided, update full_name
    if (profileData.first_name !== undefined || profileData.last_name !== undefined) {
      // Get current profile to get the missing name part if only one is provided
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single()

      if (currentProfile) {
        const firstName = profileData.first_name ?? currentProfile.first_name ?? ""
        const lastName = profileData.last_name ?? currentProfile.last_name ?? ""

        // Update the full_name
        profileData.full_name = formatFullName(firstName, lastName)
      }
    }

    const { data, error } = await supabase.from("profiles").update(profileData).eq("id", userId).select().single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error }
  }
}
