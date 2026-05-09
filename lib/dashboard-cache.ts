"use client"

import { useMemo } from "react"

// Cache global persistente para el dashboard que sobrevive remounts
class DashboardCache {
  private static instance: DashboardCache
  private cache = new Map<string, any>()
  private timestamps = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  static getInstance(): DashboardCache {
    if (!DashboardCache.instance) {
      DashboardCache.instance = new DashboardCache()
    }
    return DashboardCache.instance
  }

  set(key: string, data: any) {
    this.cache.set(key, data)
    this.timestamps.set(key, Date.now())
    console.log(`📦 Dashboard cache SET: ${key}`)
  }

  get(key: string): any | null {
    const timestamp = this.timestamps.get(key)
    if (!timestamp) return null

    const isExpired = Date.now() - timestamp > this.CACHE_DURATION
    if (isExpired) {
      this.cache.delete(key)
      this.timestamps.delete(key)
      console.log(`⏰ Dashboard cache EXPIRED: ${key}`)
      return null
    }

    const data = this.cache.get(key)
    console.log(`📦 Dashboard cache HIT: ${key}`)
    return data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear() {
    this.cache.clear()
    this.timestamps.clear()
    console.log(`🗑️ Dashboard cache CLEARED`)
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timestamps: Object.fromEntries(this.timestamps),
    }
  }
}

export const dashboardCache = DashboardCache.getInstance()

// Hook para usar el cache persistente (referencia estable para no recrear callbacks del dashboard en cada render)
export function usePersistentDashboardCache() {
  return useMemo(
    () => ({
      setStats: (stats: any) => {
        dashboardCache.set("basicStats", stats)
      },
      getStats: () => dashboardCache.get("basicStats"),
      hasStats: () => dashboardCache.has("basicStats"),
      setZoneStats: (stats: any) => {
        dashboardCache.set("zoneStats", stats)
      },
      getZoneStats: () => dashboardCache.get("zoneStats"),
      hasZoneStats: () => dashboardCache.has("zoneStats"),
      setProductStats: (stats: any) => {
        dashboardCache.set("productStats", stats)
      },
      getProductStats: () => dashboardCache.get("productStats"),
      hasProductStats: () => dashboardCache.has("productStats"),
      clearAll: () => {
        dashboardCache.clear()
      },
      getCacheStats: () => dashboardCache.getStats(),
    }),
    [],
  )
}
