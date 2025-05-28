import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Obtener todos los usuarios de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Error al obtener usuarios de auth: ${authError.message}`)
    }

    // 2. Obtener todos los perfiles existentes
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id")

    if (profilesError) {
      throw new Error(`Error al obtener perfiles: ${profilesError.message}`)
    }

    // Crear un conjunto de IDs de perfiles existentes para búsqueda rápida
    const existingProfileIds = new Set(profiles?.map((profile) => profile.id) || [])

    // 3. Identificar usuarios sin perfil
    const usersWithoutProfile = authUsers?.users.filter((user) => !existingProfileIds.has(user.id)) || []

    console.log(`Encontrados ${usersWithoutProfile.length} usuarios sin perfil`)

    // 4. Crear perfiles para usuarios que no tienen
    const createdProfiles = []
    const errors = []

    for (const user of usersWithoutProfile) {
      try {
        // Determinar el rol (usar metadatos si están disponibles)
        let role = "representante" // Rol por defecto
        if (user.app_metadata?.role) {
          role = user.app_metadata.role
        }

        // Crear perfil
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            role: role,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
            created_at: new Date().toISOString(),
          })
          .select()

        if (error) {
          throw new Error(`Error al crear perfil para ${user.email}: ${error.message}`)
        }

        createdProfiles.push({
          id: user.id,
          email: user.email,
          role: role,
        })
      } catch (error: any) {
        console.error(`Error al crear perfil para ${user.email}:`, error)
        errors.push({
          user: user.email,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado. Creados ${createdProfiles.length} perfiles.`,
      created: createdProfiles,
      errors: errors,
    })
  } catch (error: any) {
    console.error("Error en el endpoint create-missing-profiles:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
