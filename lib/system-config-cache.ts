// Cache simple que no interfiere con código existente
interface ConfigCache {
  [key: string]: {
    value: any
    timestamp: number
    ttl: number
  }
}

class SystemConfigCache {
  private cache: ConfigCache = {}
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  get(key: string): any | null {
    const cached = this.cache[key]
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      delete this.cache[key]
      return null
    }

    return cached.value
  }

  set(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl,
    }
  }

  clear(): void {
    this.cache = {}
  }
}

export const systemConfigCache = new SystemConfigCache()
