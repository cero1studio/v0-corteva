"use client"
import { getAllZones } from "@/app/actions/zones"
import { getAllTeams } from "@/app/actions/teams"
import { getAllUsers } from "@/app/actions/users"
import { NewClientForm } from "./components/new-client-form"

interface Zone {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  zone_id: string
}

interface User {
  id: string
  full_name: string | null
  team_id: string | null
  role: string
}

export default async function NewClientPage() {
  // Fetch data on the server side
  const [zonesData, teamsResult, usersResult] = await Promise.all([getAllZones(), getAllTeams(), getAllUsers()])

  const zones: Zone[] = zonesData && Array.isArray(zonesData) ? zonesData : []
  const teams: Team[] = teamsResult.success ? teamsResult.data : []
  const captains: User[] = usersResult.data ? usersResult.data.filter((user) => user.role === "capitan") : []

  return <NewClientForm zones={zones} teams={teams} captains={captains} />
}
