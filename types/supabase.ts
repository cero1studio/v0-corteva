export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      competitor_clients: {
        Row: {
          id: string
          name: string
          previous_supplier: string | null
          contact_info: string | null
          captured_by: string | null
          team_id: string | null
          capture_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          previous_supplier?: string | null
          contact_info?: string | null
          captured_by?: string | null
          team_id?: string | null
          capture_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          previous_supplier?: string | null
          contact_info?: string | null
          captured_by?: string | null
          team_id?: string | null
          capture_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      distributors: {
        Row: {
          id: string
          name: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medals: {
        Row: {
          id: string
          team_id: string
          type: string
          week_number: number | null
          year: number | null
          points: number | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          type: string
          week_number?: number | null
          year?: number | null
          points?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          type?: string
          week_number?: number | null
          year?: number | null
          points?: number | null
          created_at?: string
        }
      }
      penalties: {
        Row: {
          id: string
          team_id: string
          quantity: number
          used: number
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          quantity?: number
          used?: number
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          quantity?: number
          used?: number
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      penalty_history: {
        Row: {
          id: string
          penalty_id: string | null
          team_id: string
          action: string
          quantity: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          penalty_id?: string | null
          team_id: string
          action: string
          quantity?: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          penalty_id?: string | null
          team_id?: string
          action?: string
          quantity?: number
          description?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          points: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          role: string | null
          team_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          role?: string | null
          team_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          role?: string | null
          team_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sales: {
        Row: {
          id: string
          product_id: string
          quantity: number
          team_id: string
          user_id: string
          created_at: string
          updated_at: string
          points: number
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          team_id: string
          user_id: string
          created_at?: string
          updated_at?: string
          points?: number
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          team_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          points?: number
        }
      }
      system_config: {
        Row: {
          id: string
          key: string
          value: Json | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          zone_id: string | null
          distributor_id: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          zone_id?: string | null
          distributor_id?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          zone_id?: string | null
          distributor_id?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      zones: {
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
