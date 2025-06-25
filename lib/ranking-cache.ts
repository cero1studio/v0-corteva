// Cache específico para rankings - NO reemplaza la función existente
interface RankingCache {
  [zoneId: string]: {
    data: any[]
    timestamp: number
  }
}

class RankingCacheManager {
  private cache: RankingCache = {}
  private readonly TTL = 2 * 60 * 1000 // 2 minutos

  get(zoneId = "all"): any[] | null {
    const cached = this.cache[zoneId]
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.TTL) {
      delete this.cache[zoneId]
      return null
    }

    return cached.data
  }

  set(zoneId = "all", data: any[]): void {
    this.cache[zoneId] = {
      data,
      timestamp: Date.now(),
    }
  }

  clear(): void {
    this.cache = {}
  }
}

export const rankingCache = new RankingCacheManager()
