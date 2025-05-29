/**
 * Utilidades para navegación segura entre cliente y servidor
 */

/**
 * Navega a una URL usando window.location.href
 * Esta función solo debe usarse en el cliente
 */
export function navigateTo(
  url: string,
  options?: {
    newTab?: boolean
    replace?: boolean
  },
) {
  // Verificar que estamos en el cliente
  if (typeof window === "undefined") {
    console.warn("navigateTo solo debe usarse en el cliente")
    return
  }

  const { newTab = false, replace = false } = options || {}

  if (newTab) {
    // Abrir en nueva pestaña
    window.open(url, "_blank")
  } else if (replace) {
    // Reemplazar la URL actual (no agrega entrada al historial)
    window.location.replace(url)
  } else {
    // Navegación normal
    window.location.href = url
  }
}

/**
 * Obtiene la URL actual (solo cliente)
 */
export function getCurrentUrl(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.location.href
}

/**
 * Obtiene los parámetros de la URL actual (solo cliente)
 */
export function getUrlParams(): URLSearchParams | null {
  if (typeof window === "undefined") {
    return null
  }

  return new URLSearchParams(window.location.search)
}

/**
 * Determina si el código se está ejecutando en el cliente o en el servidor
 */
export function isClient(): boolean {
  return typeof window !== "undefined"
}

/**
 * Determina si el código se está ejecutando en el servidor
 */
export function isServer(): boolean {
  return typeof window === "undefined"
}
