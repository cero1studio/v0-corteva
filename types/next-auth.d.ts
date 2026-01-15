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
  }
}
