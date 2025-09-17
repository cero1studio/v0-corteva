"use client"

// Hook para usar en dashboards SIN cambiar su lógica
import { useEffect, useRef } from "react"
import { QueryManager } from "@/lib/query-cleanup"

export function useQueryManager() {
  const queryManagerRef = useRef<QueryManager>()

  if (!queryManagerRef.current) {
    queryManagerRef.current = new QueryManager()
  }

  useEffect(() => {
    return () => {
      queryManagerRef.current?.cleanup()
    }
  }, [])

  return queryManagerRef.current
}
