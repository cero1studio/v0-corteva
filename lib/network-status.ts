"use client"

import React from "react"

// Utilidad para detectar el estado de la conexión

/**
 * Verifica si el navegador tiene conexión a internet
 */
export const isOnline = (): boolean => {
  if (typeof navigator === "undefined") return true
  return navigator.onLine
}

/**
 * Hook para monitorear el estado de la conexión
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = React.useState(isOnline())

  React.useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isConnected
}

/**
 * Verifica la conectividad con el servidor de Supabase
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || "", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
    })
    return true
  } catch (error) {
    console.error("Error checking Supabase connection:", error)
    return false
  }
}
