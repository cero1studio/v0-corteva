"use client"

import { useCallback } from "react"

import { useEffect } from "react"

import { useState } from "react"

// Sistema de caché para datos de páginas
interface CacheItem<T> {
  data: T
  timestamp: number
  expiresIn: number
}

interface CacheConfig {
  expiresIn?: number // en milisegundos
  key: string
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultExpiry = 5 * 60 * 1000 // 5 minutos por defecto

  set<T>(key: string, data: T, expiresIn?: number): void {
    if (typeof window === "undefined") return

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresIn || this.defaultExpiry,
    }

    this.cache.set(key, item)

    // También guardar en localStorage para persistencia
    try {
      localStorage.setItem(`data_cache_${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn("Failed to save to localStorage:", error)
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null

    // Primero intentar memoria
    let item = this.cache.get(key)

    // Si no está en memoria, intentar localStorage
    if (!item) {
      try {
        const stored = localStorage.getItem(`data_cache_${key}`)
        if (stored) {
          item = JSON.parse(stored)
          if (item) {
            this.cache.set(key, item)
          }
        }
      } catch (error) {
        console.warn("Failed to load from localStorage:", error)
        return null
      }
    }

    if (!item) return null

    // Verificar si ha expirado
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
    if (typeof window !== "undefined") {
      localStorage.removeItem(`data_cache_${key}`)
    }
  }

  clear(): void {
    this.cache.clear()
    if (typeof window !== "undefined") {
      // Limpiar todas las claves de caché de localStorage
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("data_cache_"))
      keys.forEach((key) => localStorage.removeItem(key))
    }
  }

  // Método para invalidar caché relacionada con un usuario específico
  invalidateUserData(userId: string): void {
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (key.includes(userId) || key.includes("ranking") || key.includes("teams")) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.delete(key))
  }
}

export const dataCache = new DataCache()

// Hook para usar caché de datos
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = { key, expiresIn: 5 * 60 * 1000 },
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        // Intentar obtener de caché primero
        const cached = dataCache.get<T>(config.key)
        if (cached) {
          setData(cached)
          setIsLoading(false)
          return
        }

        // Si no hay caché, hacer la petición
        setIsLoading(true)
        const result = await fetcher()

        if (mounted) {
          setData(result)
          dataCache.set(config.key, result, config.expiresIn)
          setError(null)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message)
          console.error(`Error loading data for ${config.key}:`, err)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [config.key, config.expiresIn])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    dataCache.delete(config.key)

    try {
      const result = await fetcher()
      setData(result)
      dataCache.set(config.key, result, config.expiresIn)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [config.key, config.expiresIn, fetcher])

  return { data, isLoading, error, refresh }
}
