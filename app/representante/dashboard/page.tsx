import { redirect } from "next/navigation"

export default function RepresentanteDashboardRedirect() {
  redirect("/capitan/dashboard")
  return null
}
