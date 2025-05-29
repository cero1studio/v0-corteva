// Script para aplicar fixes automáticos a todas las páginas dinámicas
export const DYNAMIC_PAGE_TEMPLATE = `
import { use } from "react"
import type { DynamicPageProps } from "@/types/next"

interface PageProps extends DynamicPageProps<{ id: string }> {}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params)
  // Usar resolvedParams.id en lugar de params.id
  
  // Resto del componente...
}
`

// Lista de archivos que necesitan ser actualizados
export const FILES_TO_UPDATE = [
  "app/admin/distribuidores/editar/[id]/page.tsx",
  "app/admin/productos/editar/[id]/page.tsx",
  "app/admin/usuarios/editar/[id]/page.tsx",
  "app/admin/zonas/editar/[id]/page.tsx",
  // Agregar más archivos según sea necesario
]
