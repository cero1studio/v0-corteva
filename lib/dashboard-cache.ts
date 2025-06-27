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

// Hook para usar el cache persistente
export function usePersistentDashboardCache() {
  const setStats = (stats: any) => {
    dashboardCache.set("basicStats", stats)
  }

  const getStats = () => {
    return dashboardCache.get("basicStats")
  }

  const hasStats = () => {
    return dashboardCache.has("basicStats")
  }

  const setZoneStats = (stats: any) => {
    dashboardCache.set("zoneStats", stats)
  }

  const getZoneStats = () => {
    return dashboardCache.get("zoneStats")
  }

  const hasZoneStats = () => {
    return dashboardCache.has("zoneStats")
  }

  const setProductStats = (stats: any) => {
    dashboardCache.set("productStats", stats)
  }

  const getProductStats = () => {
    return dashboardCache.get("productStats")
  }

  const hasProductStats = () => {
    return dashboardCache.has("productStats")
  }

  const clearAll = () => {
    dashboardCache.clear()
  }

  return {
    setStats,
    getStats,
    hasStats,
    setZoneStats,
    getZoneStats,
    hasZoneStats,
    setProductStats,
    getProductStats,
    hasProductStats,
    clearAll,
    getCacheStats: () => dashboardCache.getStats(),
  }
}
