import { supabase } from "@/lib/supabase"

export interface Technician {
  id: string
  full_name: string
  specialties: {
    id: string
    name: string
  }[]
}

// Get technicians with their specialties
export async function getTechniciansWithSpecialties(): Promise<{ success: boolean; data?: Technician[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        technician_specialties(
          specialty_id,
          specialties:specialty_id(
            id,
            name
          )
        )
      `)
      .eq("role", "Technician")
      .order("full_name")

    if (error) throw error

    // Transform the data to a more usable format
    const technicians = (data || []).map((tech) => ({
      id: tech.id,
      full_name: tech.full_name,
      specialties: tech.technician_specialties.map((ts: any) => ({
        id: ts.specialties.id,
        name: ts.specialties.name,
      })),
    }))

    return { success: true, data: technicians }
  } catch (error) {
    console.error("Error fetching technicians with specialties:", error)
    return { success: false, error }
  }
}
