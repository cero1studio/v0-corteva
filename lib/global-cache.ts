"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Cache global para evitar re-fetching innecesario
const globalCache = new Map<string, { data: any; timestamp: number; loading: boolean }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useGlobalCache() {
  const clearCache = useCallback((key?: string) => {
    if (key) {
      globalCache.delete(key)
    } else {
      globalCache.clear()
    }
  }, [])

  const getCacheData = useCallback((key: string) => {
    const cached = globalCache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION
    if (isExpired) {
      globalCache.delete(key)
      return null
    }

    return cached
  }, [])

  const setCacheData = useCallback((key: string, data: any, loading = false) => {
    globalCache.set(key, {
      data,
      timestamp: Date.now(),
      loading,
    })
  }, [])

  return { clearCache, getCacheData, setCacheData }
}

export function useCachedList<T>(cacheKey: string, fetchFunction: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCacheData, setCacheData } = useGlobalCache()
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(
    async (force = false) => {
      if (!mountedRef.current) return

      // Verificar cache primero
      if (!force) {
        const cached = getCacheData(cacheKey)
        if (cached && !cached.loading) {
          setData(cached.data)
          setLoading(false)
          return cached.data
        }
      }

      // Cancelar request anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)

      // Marcar como loading en cache
      setCacheData(cacheKey, data, true)

      try {
        const result = await fetchFunction()

        if (mountedRef.current) {
          setData(result)
          setLoading(false)
          setCacheData(cacheKey, result, false)
          return result
        }
      } catch (err: any) {
        if (mountedRef.current && err.name !== "AbortError") {
          const errorMessage = err.message || "Error al cargar datos"
          setError(errorMessage)
          setLoading(false)
          setCacheData(cacheKey, null, false)
        }
      }
    },
    [cacheKey, fetchFunction, getCacheData, setCacheData, data],
  )

  useEffect(() => {
    mountedRef.current = true
    refresh()

    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, dependencies)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { data, loading, error, refresh }
}
