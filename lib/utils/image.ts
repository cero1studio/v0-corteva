import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase para acceso público a Storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getImageUrl(path: string | null): string {
  if (!path) {
    return "/placeholder.svg"
  }

  // Si es una URL completa, devolverla tal como está
  if (path.startsWith("http")) {
    return path
  }

  // Si es una ruta local (logos predefinidos), devolverla tal como está
  if (path.startsWith("/")) {
    return path
  }

  // Si es una ruta de Supabase Storage, generar la URL pública
  try {
    const { data } = supabase.storage.from("images").getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error("Error al generar URL de imagen:", error)
    return "/placeholder.svg"
  }
}

export function getDistributorLogoUrl(distributor: { name: string; logo_url: string | null }): string {
  // Si tiene una imagen personalizada en Storage
  if (distributor.logo_url) {
    return getImageUrl(distributor.logo_url)
  }

  // Si no tiene imagen, usar logo predefinido basado en el nombre
  const normalizedName = distributor.name.toLowerCase().trim()

  // Mapeo de distribuidores a sus logos
  const distributorLogos: Record<string, string> = {
    agralba: "/logos/agralba.png",
    "agralba antioquia": "/logos/agralba-antioquia.png",
    coacosta: "/logos/coacosta.png",
    hernandez: "/logos/hernandez.png",
    insagrin: "/logos/insagrin.png",
    cosechar: "/logos/cosechar.png",
  }

  // Buscar coincidencia exacta primero
  if (distributorLogos[normalizedName]) {
    return distributorLogos[normalizedName]
  }

  // Buscar coincidencia parcial
  for (const [key, logoUrl] of Object.entries(distributorLogos)) {
    if (normalizedName.includes(key)) {
      return logoUrl
    }
  }

  // Logo por defecto si no hay coincidencia
  return "/logos/agralba-antioquia.png"
}
