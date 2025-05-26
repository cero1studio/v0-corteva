import { redirect } from "next/navigation"

export default function RegistrarClienteRedirect() {
  redirect("/capitan/registrar-cliente")
  return null
}
