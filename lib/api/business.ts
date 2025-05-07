import { supabase } from "@/lib/supabase"

export interface BusinessInformation {
  id?: string
  logo?: string | null
  business_name: string
  address: string
  email: string
  phone: string
  website?: string | null
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface WorkingHours {
  id?: string
  business_id: string
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  open_time: string | null
  close_time: string | null
}

export interface Holiday {
  id?: string
  business_id: string
  date: string
  label: string
  created_at?: string
}

// Business Information API
export async function getBusinessInformation(): Promise<BusinessInformation | null> {
  try {
    const { data, error } = await supabase.from("business_information").select("*").limit(1).single()

    if (error) {
      console.error("Error fetching business information:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exception fetching business information:", error)
    return null
  }
}

export async function createBusinessInformation(
  info: BusinessInformation,
): Promise<{ success: boolean; data?: BusinessInformation; error?: any }> {
  try {
    const { data, error } = await supabase.from("business_information").insert([info]).select().single()

    if (error) {
      console.error("Error creating business information:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception creating business information:", error)
    return { success: false, error }
  }
}

export async function updateBusinessInformation(
  id: string,
  info: Partial<BusinessInformation>,
): Promise<{ success: boolean; data?: BusinessInformation; error?: any }> {
  try {
    const { data, error } = await supabase.from("business_information").update(info).eq("id", id).select().single()

    if (error) {
      console.error("Error updating business information:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception updating business information:", error)
    return { success: false, error }
  }
}

// Working Hours API
export async function getWorkingHours(businessId: string): Promise<WorkingHours[]> {
  try {
    const { data, error } = await supabase.from("working_hours").select("*").eq("business_id", businessId).order("day")

    if (error) {
      console.error("Error fetching working hours:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching working hours:", error)
    return []
  }
}

export async function upsertWorkingHours(
  hours: WorkingHours,
): Promise<{ success: boolean; data?: WorkingHours; error?: any }> {
  try {
    // Check if record exists
    const { data: existingData } = await supabase
      .from("working_hours")
      .select("id")
      .eq("business_id", hours.business_id)
      .eq("day", hours.day)
      .single()

    let result

    if (existingData?.id) {
      // Update existing record
      result = await supabase
        .from("working_hours")
        .update({
          open_time: hours.open_time,
          close_time: hours.close_time,
        })
        .eq("id", existingData.id)
        .select()
        .single()
    } else {
      // Insert new record
      result = await supabase.from("working_hours").insert([hours]).select().single()
    }

    const { data, error } = result

    if (error) {
      console.error("Error upserting working hours:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception upserting working hours:", error)
    return { success: false, error }
  }
}

// Holidays API
export async function getHolidays(businessId: string): Promise<Holiday[]> {
  try {
    const { data, error } = await supabase.from("holidays").select("*").eq("business_id", businessId).order("date")

    if (error) {
      console.error("Error fetching holidays:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Exception fetching holidays:", error)
    return []
  }
}

export async function createHoliday(holiday: Holiday): Promise<{ success: boolean; data?: Holiday; error?: any }> {
  try {
    const { data, error } = await supabase.from("holidays").insert([holiday]).select().single()

    if (error) {
      console.error("Error creating holiday:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception creating holiday:", error)
    return { success: false, error }
  }
}

export async function updateHoliday(
  id: string,
  holiday: Partial<Holiday>,
): Promise<{ success: boolean; data?: Holiday; error?: any }> {
  try {
    const { data, error } = await supabase.from("holidays").update(holiday).eq("id", id).select().single()

    if (error) {
      console.error("Error updating holiday:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception updating holiday:", error)
    return { success: false, error }
  }
}

export async function deleteHoliday(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.from("holidays").delete().eq("id", id)

    if (error) {
      console.error("Error deleting holiday:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Exception deleting holiday:", error)
    return { success: false, error }
  }
}

// Initialize default working hours for a business
export async function initializeDefaultWorkingHours(businessId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] = [
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ]

    const defaultHours = days.map((day) => ({
      business_id: businessId,
      day,
      open_time: day === "sat" || day === "sun" ? null : "09:00:00",
      close_time: day === "sat" || day === "sun" ? null : "18:00:00",
    }))

    const { error } = await supabase.from("working_hours").insert(defaultHours)

    if (error) {
      console.error("Error initializing default working hours:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Exception initializing default working hours:", error)
    return { success: false, error }
  }
}
