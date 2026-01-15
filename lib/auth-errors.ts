export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED",
  AUTH_ERROR: "AUTH_ERROR",
  SUPABASE_ERROR: "SUPABASE_ERROR",
} as const

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: "Correo o contraseña incorrectos",
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: "No existe una cuenta con este correo",
  [AUTH_ERROR_CODES.PROFILE_NOT_FOUND]: "Perfil de usuario no encontrado. Contacta al administrador",
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: "Debes confirmar tu correo electrónico",
  [AUTH_ERROR_CODES.AUTH_ERROR]: "Error de autenticación. Intenta nuevamente",
  [AUTH_ERROR_CODES.SUPABASE_ERROR]: "Error de conexión. Verifica tu internet",
  CredentialsSignin: "Credenciales inválidas",
}

export function getErrorMessage(errorCode: string): string {
  return AUTH_ERROR_MESSAGES[errorCode] || "Error al iniciar sesión"
}
