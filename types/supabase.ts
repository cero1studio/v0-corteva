export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      free_kick_goals: {
        Row: {
          id: string
          team_id: string | null
          vendedor_name?: string | null
          tecnico_name?: string | null
          points: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id?: string | null
          points: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string | null
          points?: number
          reason?: string
          created_at?: string
        }
        Relationships: any[]
      },
      competitor_clients: {
        Row: {
          id: string
          name: string
          previous_supplier: string | null
          contact_info: string | null
          captured_by: string | null
          team_id: string | null
          vendedor_name?: string | null
          tecnico_name?: string | null
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
        Relationships: any[]
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
        Relationships: any[]
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
        Relationships: any[]
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
        Relationships: any[]
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
        Relationships: any[]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          points: number
          content_per_unit: number | null
          content_unit: string | null
          active: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          points: number
          content_per_unit?: number | null
          content_unit?: string | null
          active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          points?: number
          content_per_unit?: number | null
          content_unit?: string | null
          active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          representative_id?: string | null | null
          email: string
          full_name: string | null
          role: string | null
          team_id: string | null
          vendedor_name?: string | null
          tecnico_name?: string | null
          zone_id: string | null
          distributor_id: string | null
          created_at: string | null
          updated_at: string | null
          force_password_change: boolean | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          full_name?: string | null
          role?: string | null
          team_id?: string | null
          zone_id?: string | null
          distributor_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          force_password_change?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          full_name?: string | null
          role?: string | null
          team_id?: string | null
          zone_id?: string | null
          distributor_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          force_password_change?: boolean | null
        }
        Relationships: any[]
      }
      sales: {
        Row: {
          id: string
          product_id: string
          quantity: number
          team_id: string
          user_id: string
          representative_id?: string | null
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
          representative_id?: string | null
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
        Relationships: any[]
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
        Relationships: any[]
      }
      teams: {
        Row: {
          id: string
          name: string
          zone_id: string | null
          distributor_id: string | null
          logo_url: string | null
          total_points?: number
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
        Relationships: any[]
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
        Relationships: any[]
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
