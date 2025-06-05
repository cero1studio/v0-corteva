export interface Zone {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface Team {
  id: string
  name: string
  zone_id: string
  captain_id?: string
  total_points?: number
  created_at?: string
  updated_at?: string
  zone?: Zone
}

export interface User {
  id: string
  email: string
  full_name?: string
  role: "admin" | "capitan" | "representante" | "supervisor" | "director_tecnico" | "arbitro"
  team_id?: string
  zone_id?: string
  created_at?: string
  updated_at?: string
}

export interface Sale {
  id: string
  representative_id: string
  team_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  sale_date: string
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  points_value: number
  image_url?: string
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  representative_id: string
  team_id: string
  created_at?: string
  updated_at?: string
}

export interface FreeKickGoal {
  id: string
  team_id: string
  representative_id: string
  description?: string
  points: number
  created_by: string
  created_at?: string
  updated_at?: string
}
