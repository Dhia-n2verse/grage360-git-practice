export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          first_name?: string
          last_name?: string
          email: string
          role: "Manager" | "Technician" | "Front Desk"
          avatar_url: string | null
          image?: string | null
          phone?: string | null
          address?: string | null
          theme_mode?: string | null
          theme_color?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          first_name?: string
          last_name?: string
          email: string
          role: "Manager" | "Technician" | "Front Desk"
          avatar_url?: string | null
          image?: string | null
          phone?: string | null
          address?: string | null
          theme_mode?: string | null
          theme_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: "Manager" | "Technician" | "Front Desk"
          avatar_url?: string | null
          image?: string | null
          phone?: string | null
          address?: string | null
          theme_mode?: string | null
          theme_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_pins: {
        Row: {
          id: string
          user_id: string
          pin: string
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pin: string
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pin?: string
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      specialties: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      technician_specialties: {
        Row: {
          id: string
          technician_id: string
          specialty_id: string
          created_at: string
        }
        Insert: {
          id?: string
          technician_id: string
          specialty_id: string
          created_at?: string
        }
        Update: {
          id?: string
          technician_id?: string
          specialty_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
