import { supabase } from "@/lib/supabase"

export interface Customer {
  id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  type: "personal" | "business"
  company_name?: string
  fiscal_id?: string
  company_address?: string
  image?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export async function getCustomers(
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
  letterFilter: string | null = null,
): Promise<{ data: Customer[]; count: number; error: any }> {
  try {
    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query with pagination and sorting
    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })

    // Apply letter filter if provided
    if (letterFilter) {
      // Filter by first letter of first_name
      query = query.ilike("first_name", `${letterFilter}%`)
    }

    // Filter out disabled customers
    query = query.neq("status", "disabled")

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return { data: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching customers:", error)
    return { data: [], count: 0, error }
  }
}
