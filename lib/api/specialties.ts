import { supabase } from "@/lib/supabase"
import type { Specialty } from "@/types/specialties"

// Get all specialties
export async function getAllSpecialties() {
  try {
    const { data, error } = await supabase.from("specialties").select("*").order("name")

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching specialties:", error)
    return { success: false, error }
  }
}

// Get specialties for a technician
export async function getTechnicianSpecialties(technicianId: string) {
  try {
    const { data, error } = await supabase
      .from("technician_specialties")
      .select(`
        specialty_id,
        specialties:specialty_id(*)
      `)
      .eq("technician_id", technicianId)

    if (error) throw error

    // Extract the specialty objects from the joined data
    const specialties = data.map((item) => item.specialties) as Specialty[]

    return { success: true, data: specialties }
  } catch (error) {
    console.error("Error fetching technician specialties:", error)
    return { success: false, error }
  }
}

// Update specialties for a technician
export async function updateTechnicianSpecialties(technicianId: string, specialtyIds: string[]) {
  try {
    // First, delete all existing specialties for this technician
    const { error: deleteError } = await supabase
      .from("technician_specialties")
      .delete()
      .eq("technician_id", technicianId)

    if (deleteError) throw deleteError

    // If there are no specialties to add, we're done
    if (!specialtyIds.length) {
      return { success: true }
    }

    // Insert the new specialties
    const specialtiesToInsert = specialtyIds.map((specialtyId) => ({
      technician_id: technicianId,
      specialty_id: specialtyId,
    }))

    const { error: insertError } = await supabase.from("technician_specialties").insert(specialtiesToInsert)

    if (insertError) throw insertError

    return { success: true }
  } catch (error) {
    console.error("Error updating technician specialties:", error)
    return { success: false, error }
  }
}
