"use server"

import { adminSupabase } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Función simplificada para crear usuarios con permisos de administrador
export async function createUserSimple(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const role = formData.get("role") as string
    const zoneId = formData.get("zoneId") as string
    const distributorId = formData.get("distributorId") as string

    // Validaciones básicas
    if (!email || !password || !fullName || !role) {
      return { error: "Todos los campos son obligatorios" }
    }

    if (password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres" }
    }

    console.log("🚀 Creando usuario con adminSupabase...")

    // Paso 1: Crear usuario en Auth
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    })

    if (authError) {
      console.error("❌ Error en auth:", authError)
      return { error: `Error de autenticación: ${authError.message}` }
    }

    if (!authUser.user) {
      return { error: "No se pudo crear el usuario" }
    }

    console.log("✅ Usuario creado en auth:", authUser.user.id)

    // Paso 2: Crear perfil en base de datos
    const profileData = {
      id: authUser.user.id,
      email,
      full_name: fullName,
      role,
      zone_id: zoneId && zoneId !== "none" ? zoneId : null,
      distributor_id: distributorId && distributorId !== "none" ? distributorId : null,
    }

    const { error: profileError } = await adminSupabase.from("profiles").insert(profileData)

    if (profileError) {
      console.error("❌ Error en perfil:", profileError)

      // Limpiar usuario de auth si falla el perfil
      await adminSupabase.auth.admin.deleteUser(authUser.user.id)

      return { error: `Error al crear perfil: ${profileError.message}` }
    }

    console.log("✅ Perfil creado exitosamente")

    revalidatePath("/admin/usuarios")
    return {
      success: true,
      message: "Usuario creado exitosamente",
      userId: authUser.user.id,
    }
  } catch (error: any) {
    console.error("💥 Error general:", error)
    return { error: `Error inesperado: ${error.message}` }
  }
}

// Función para verificar permisos de adminSupabase
export async function testAdminPermissions() {
  try {
    console.log("🔍 Verificando permisos de admin...")

    // Test 1: Verificar conexión
    const { data: testData, error: testError } = await adminSupabase.from("profiles").select("count").limit(1)

    if (testError) {
      console.error("❌ Error de conexión:", testError)
      return { error: `Error de conexión: ${testError.message}` }
    }

    console.log("✅ Conexión exitosa")

    // Test 2: Verificar permisos de auth admin
    const { data: authTest, error: authTestError } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    if (authTestError) {
      console.error("❌ Error de permisos auth:", authTestError)
      return { error: `Error de permisos auth: ${authTestError.message}` }
    }

    console.log("✅ Permisos de auth admin verificados")

    return {
      success: true,
      message: "Todos los permisos están configurados correctamente",
    }
  } catch (error: any) {
    console.error("💥 Error en verificación:", error)
    return { error: `Error en verificación: ${error.message}` }
  }
}
