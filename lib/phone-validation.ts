/**
 * Utilidades para validación de números telefónicos colombianos
 */

// Regex para números de celular colombianos
const COLOMBIA_MOBILE_REGEX = /^3[0-9]{9}$/

// Regex más flexible que acepta diferentes formatos
const COLOMBIA_MOBILE_FLEXIBLE_REGEX = /^(\+57\s?)?3[0-9]{9}$/

/**
 * Valida si un número es un celular colombiano válido
 */
export function isValidColombianMobile(phone: string): boolean {
  if (!phone) return false

  // Limpiar el número (remover espacios, guiones, paréntesis)
  const cleanPhone = phone.replace(/[\s\-$$$$+]/g, "")

  // Si empieza con 57 (código de país), removerlo
  const phoneWithoutCountryCode = cleanPhone.startsWith("57") ? cleanPhone.slice(2) : cleanPhone

  // Validar que sea un número de celular colombiano (10 dígitos, empieza con 3)
  return COLOMBIA_MOBILE_REGEX.test(phoneWithoutCountryCode)
}

/**
 * Formatea un número telefónico colombiano
 */
export function formatColombianMobile(phone: string): string {
  if (!phone) return ""

  const cleanPhone = phone.replace(/[\s\-$$$$+]/g, "")
  const phoneWithoutCountryCode = cleanPhone.startsWith("57") ? cleanPhone.slice(2) : cleanPhone

  if (phoneWithoutCountryCode.length === 10 && phoneWithoutCountryCode.startsWith("3")) {
    // Formato: 320 581 2587
    return phoneWithoutCountryCode.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
  }

  return phone
}

/**
 * Obtiene mensajes de error específicos para validación
 */
export function getPhoneValidationError(phone: string): string | null {
  if (!phone || phone.trim() === "") {
    return "El número de celular es requerido"
  }

  const cleanPhone = phone.replace(/[\s\-$$$$+]/g, "")
  const phoneWithoutCountryCode = cleanPhone.startsWith("57") ? cleanPhone.slice(2) : cleanPhone

  if (phoneWithoutCountryCode.length < 10) {
    return "El número debe tener al menos 10 dígitos"
  }

  if (phoneWithoutCountryCode.length > 10) {
    return "El número no puede tener más de 10 dígitos"
  }

  if (!phoneWithoutCountryCode.startsWith("3")) {
    return "Los números de celular en Colombia deben empezar con 3"
  }

  if (!/^\d+$/.test(phoneWithoutCountryCode)) {
    return "El número solo puede contener dígitos"
  }

  if (!isValidColombianMobile(phone)) {
    return "Ingresa un número de celular colombiano válido (ej: 3205812587)"
  }

  return null
}

/**
 * Componente de input con validación de teléfono
 */
export const PHONE_INPUT_PROPS = {
  type: "tel",
  placeholder: "3205812587",
  maxLength: 15, // Permite espacios y formato
  pattern: "[0-9\\s\\-$$$$\\+]*",
}
