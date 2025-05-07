import { supabase } from "@/lib/supabase"

/**
 * Normalizes a vehicle make name by trimming spaces and converting to lowercase
 */
export function normalizeMakeName(make: string): string {
  return make.trim().toLowerCase()
}

/**
 * Checks if a logo exists for the given make and returns the URL
 */
export async function getVehicleMakeLogo(make: string): Promise<string | null> {
  try {
    const normalizedMake = normalizeMakeName(make)
    const logoPath = `${normalizedMake}.png`

    // Check if the logo exists in the make-logo bucket
    const { data, error } = await supabase.storage.from("make-logo").getPublicUrl(logoPath)

    if (error) {
      console.error("Error fetching logo:", error)
      return null
    }

    // Verify the logo exists by making a HEAD request
    try {
      const response = await fetch(data.publicUrl, { method: "HEAD" })
      if (response.ok) {
        return data.publicUrl
      }
    } catch (err) {
      console.error("Error verifying logo existence:", err)
    }

    return null
  } catch (error) {
    console.error("Error in getVehicleMakeLogo:", error)
    return null
  }
}
