import "next-auth"
import "next-auth/jwt"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      team_id?: string | null
      team_name?: string | null
      zone_id?: string
      distributor_id?: string
      force_password_change?: boolean
      original_admin_id?: string
      original_admin_role?: string
      original_admin_name?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    team_id?: string | null
    team_name?: string | null
    zone_id?: string
    distributor_id?: string
    force_password_change?: boolean
    original_admin_id?: string
    original_admin_role?: string
    original_admin_name?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: string
    team_id?: string | null
    team_name?: string | null
    zone_id?: string
    distributor_id?: string
    force_password_change?: boolean
    original_admin_id?: string
    original_admin_role?: string
    original_admin_name?: string
  }
}
