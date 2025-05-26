export interface Penalty {
  id: string
  team_id: string
  quantity: number
  used: number
  reason: string | null
  created_at: string
  updated_at: string
}

export interface PenaltyHistory {
  id: string
  penalty_id: string
  team_id: string
  action: "earned" | "used"
  quantity: number
  description: string | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  logo_url: string | null
  distributor_id: string
  zone_id: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  team_id: string | null
  role: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}
