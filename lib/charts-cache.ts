interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class ChartsCache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 10 * 60 * 1000 // 10 minutos

  private generateKey(query: string, params?: any): string {
    return `${query}_${JSON.stringify(params || {})}`
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  clear(): void {
    this.cache.clear()
  }

  // Wrapper para consultas de Supabase
  async wrapQuery<T>(queryKey: string, queryFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(queryKey)
    if (cached) {
      console.log(`📊 Cache HIT: ${queryKey}`)
      return cached
    }

    console.log(`📊 Cache MISS: ${queryKey}`)
    const result = await queryFn()
    this.set(queryKey, result, ttl)
    return result
  }

  // Método específico para datos de ranking
  async wrapRankingQuery<T>(queryFn: () => Promise<T>, zoneId?: string): Promise<T> {
    const key = `ranking_${zoneId || "all"}`
    return this.wrapQuery(key, queryFn, 15 * 60 * 1000) // 15 min para ranking
  }

  // Método específico para datos de gráficas
  async wrapChartQuery<T>(chartType: string, queryFn: () => Promise<T>): Promise<T> {
    const key = `chart_${chartType}`
    return this.wrapQuery(key, queryFn, 12 * 60 * 1000) // 12 min para gráficas
  }
}

// Instancia singleton
export const chartsCache = new ChartsCache()

// Helper para limpiar cache cuando hay nuevos datos
export const invalidateChartsCache = () => {
  chartsCache.clear()
  console.log("📊 Charts cache invalidated")
}
