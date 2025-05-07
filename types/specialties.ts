export interface Specialty {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface TechnicianSpecialty {
  id: string
  technician_id: string
  specialty_id: string
  created_at: string
}

// Update the Database type to include the new tables
export type SpecialtiesTable = {
  Row: Specialty
  Insert: Omit<Specialty, "id" | "created_at" | "updated_at">
  Update: Partial<Omit<Specialty, "id" | "created_at" | "updated_at">>
}

export type TechnicianSpecialtiesTable = {
  Row: TechnicianSpecialty
  Insert: Omit<TechnicianSpecialty, "id" | "created_at">
  Update: Partial<Omit<TechnicianSpecialty, "id" | "created_at">>
}
