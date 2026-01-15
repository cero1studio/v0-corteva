import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { validateCredentials, getUserProfile } from "@/lib/auth-utils"

// Validar variables de entorno al cargar el módulo
if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ NEXTAUTH_SECRET no está definido en las variables de entorno")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables de Supabase no están definidas")
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Missing credentials")
          throw new Error("INVALID_CREDENTIALS")
        }

        try {
          // Validar credenciales contra auth.users de Supabase
          const user = await validateCredentials(credentials.email, credentials.password)

          // Obtener perfil del usuario
          const profile = await getUserProfile(user.id)

          console.log("[NEXTAUTH] Profile data:", {
            id: profile.id,
            role: profile.role,
            zone_id: profile.zone_id,
            distributor_id: profile.distributor_id,
            hasZone: !!profile.zone_id,
            hasDistributor: !!profile.distributor_id,
          })

          // Retornar usuario con perfil incluido
          return {
            id: user.id,
            email: user.email,
            name: profile.full_name,
            role: profile.role,
            team_id: profile.team_id,
            team_name: profile.team_name,
            zone_id: profile.zone_id,
            distributor_id: profile.distributor_id,
          }
        } catch (error: any) {
          console.error("❌ Error in authorize:", error)
          // Propagar el código de error específico
          // NextAuth v4 captura el error y lo pasa como error en el callback
          throw new Error(error.message || "AUTH_ERROR")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Al iniciar sesión, agregar datos del usuario al token
      if (user) {
        console.log("[NEXTAUTH] JWT callback - User data:", { id: user.id, email: user.email, role: user.role })
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.team_id = user.team_id
        token.team_name = user.team_name
        token.zone_id = user.zone_id
        token.distributor_id = user.distributor_id
        console.log("[NEXTAUTH] JWT callback - Token updated with role:", token.role)
      }

      // Permitir actualización del token desde el cliente
      if (trigger === "update" && session) {
        console.log("[NEXTAUTH] JWT callback - Updating token with session:", session)
        // Actualizar campos específicos del token
        if (session.team_id !== undefined) {
          token.team_id = session.team_id as string | null
        }
        if (session.team_name !== undefined) {
          token.team_name = session.team_name as string | null
        }
        // Mantener otros campos del token
        return token
      }

      return token
    },
    async session({ session, token }) {
      // Agregar datos del token a la sesión
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.team_id = token.team_id as string | null
        session.user.team_name = token.team_name as string | null
        session.user.zone_id = token.zone_id as string
        session.user.distributor_id = token.distributor_id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

let handler: ReturnType<typeof NextAuth>

try {
  handler = NextAuth(authOptions)
} catch (error) {
  console.error("❌ Error inicializando NextAuth:", error)
  throw error
}

export { handler as GET, handler as POST }
