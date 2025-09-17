// Sistema de diagnóstico para detectar memory leaks y estados inconsistentes

class DiagnosticsManager {
  private static instance: DiagnosticsManager
  private logs: Array<{ timestamp: number; component: string; event: string; data: any }> = []
  private activePromises = new Set<string>()
  private activeTimeouts = new Set<number>()
  private activeIntervals = new Set<number>()
  private activeAbortControllers = new Set<AbortController>()
  private componentStates = new Map<string, any>()
  private supabaseListeners = new Set<string>()

  static getInstance(): DiagnosticsManager {
    if (!DiagnosticsManager.instance) {
      DiagnosticsManager.instance = new DiagnosticsManager()
    }
    return DiagnosticsManager.instance
  }

  // Logging detallado
  log(component: string, event: string, data?: any) {
    const entry = {
      timestamp: Date.now(),
      component,
      event,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    }
    this.logs.push(entry)

    // Solo mantener los últimos 100 logs
    if (this.logs.length > 100) {
      this.logs.shift()
    }

    console.log(`🔍 [${component}] ${event}`, data)
  }

  // Tracking de Promises
  trackPromise(id: string, promise: Promise<any>) {
    this.activePromises.add(id)
    this.log("PROMISE", `Started: ${id}`)

    promise.finally(() => {
      this.activePromises.delete(id)
      this.log("PROMISE", `Finished: ${id}`)
    })

    return promise
  }

  // Tracking de Timeouts
  trackTimeout(callback: () => void, delay: number, id?: string): number {
    const timeoutId = setTimeout(() => {
      this.activeTimeouts.delete(timeoutId)
      this.log("TIMEOUT", `Executed: ${id || timeoutId}`)
      callback()
    }, delay)

    this.activeTimeouts.add(timeoutId)
    this.log("TIMEOUT", `Created: ${id || timeoutId}`, { delay, timeoutId })

    return timeoutId
  }

  // Tracking de AbortControllers
  trackAbortController(id: string): AbortController {
    const controller = new AbortController()
    this.activeAbortControllers.add(controller)
    this.log("ABORT_CONTROLLER", `Created: ${id}`)

    controller.signal.addEventListener("abort", () => {
      this.activeAbortControllers.delete(controller)
      this.log("ABORT_CONTROLLER", `Aborted: ${id}`)
    })

    return controller
  }

  // Tracking de estados de componentes
  trackComponentState(componentId: string, state: any) {
    this.componentStates.set(componentId, {
      ...state,
      timestamp: Date.now(),
    })
    this.log("COMPONENT_STATE", `Updated: ${componentId}`, state)
  }

  // Tracking de listeners de Supabase
  trackSupabaseListener(id: string) {
    this.supabaseListeners.add(id)
    this.log("SUPABASE_LISTENER", `Added: ${id}`)
  }

  removeSupabaseListener(id: string) {
    this.supabaseListeners.delete(id)
    this.log("SUPABASE_LISTENER", `Removed: ${id}`)
  }

  // Limpiar timeouts manualmente
  clearTimeout(timeoutId: number) {
    clearTimeout(timeoutId)
    this.activeTimeouts.delete(timeoutId)
    this.log("TIMEOUT", `Cleared: ${timeoutId}`)
  }

  // Generar reporte de diagnóstico
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      activePromises: Array.from(this.activePromises),
      activeTimeouts: Array.from(this.activeTimeouts),
      activeIntervals: Array.from(this.activeIntervals),
      activeAbortControllers: this.activeAbortControllers.size,
      componentStates: Object.fromEntries(this.componentStates),
      supabaseListeners: Array.from(this.supabaseListeners),
      recentLogs: this.logs.slice(-20), // Últimos 20 logs
      memoryUsage: this.getMemoryUsage(),
    }

    console.log("📊 DIAGNOSTICS REPORT:", report)
    return report
  }

  // Detectar memory leaks
  detectLeaks() {
    const leaks = {
      promises: this.activePromises.size > 5,
      timeouts: this.activeTimeouts.size > 10,
      abortControllers: this.activeAbortControllers.size > 5,
      supabaseListeners: this.supabaseListeners.size > 3,
      staleStates: this.detectStaleStates(),
    }

    if (Object.values(leaks).some(Boolean)) {
      console.warn("🚨 MEMORY LEAKS DETECTED:", leaks)
      this.generateReport()
    }

    return leaks
  }

  private detectStaleStates() {
    const now = Date.now()
    const staleThreshold = 5 * 60 * 1000 // 5 minutos

    return Array.from(this.componentStates.entries())
      .filter(([_, state]) => now - state.timestamp > staleThreshold)
      .map(([id]) => id)
  }

  private getMemoryUsage() {
    if (typeof window !== "undefined" && "performance" in window && "memory" in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      }
    }
    return null
  }

  // Limpiar todo (para testing)
  clearAll() {
    this.activePromises.clear()
    this.activeTimeouts.forEach((id) => clearTimeout(id))
    this.activeTimeouts.clear()
    this.activeIntervals.forEach((id) => clearInterval(id))
    this.activeIntervals.clear()
    this.activeAbortControllers.forEach((controller) => controller.abort())
    this.activeAbortControllers.clear()
    this.componentStates.clear()
    this.supabaseListeners.clear()
    this.logs = []
    this.log("DIAGNOSTICS", "Cleared all tracked resources")
  }
}

export const diagnostics = DiagnosticsManager.getInstance()

// Hook para usar en componentes
export function useDiagnostics(componentId: string) {
  const trackState = (state: any) => {
    diagnostics.trackComponentState(componentId, state)
  }

  const trackPromise = (id: string, promise: Promise<any>) => {
    return diagnostics.trackPromise(`${componentId}:${id}`, promise)
  }

  const trackTimeout = (callback: () => void, delay: number, id?: string) => {
    return diagnostics.trackTimeout(callback, delay, `${componentId}:${id}`)
  }

  const trackAbortController = (id: string) => {
    return diagnostics.trackAbortController(`${componentId}:${id}`)
  }

  const clearTimeout = (timeoutId: number) => {
    return diagnostics.clearTimeout(timeoutId)
  }

  return {
    trackState,
    trackPromise,
    trackTimeout,
    trackAbortController,
    clearTimeout,
    log: (event: string, data?: any) => diagnostics.log(componentId, event, data),
    generateReport: () => diagnostics.generateReport(),
    detectLeaks: () => diagnostics.detectLeaks(),
  }
}
