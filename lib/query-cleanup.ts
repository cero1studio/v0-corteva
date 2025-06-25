// Utility para manejar cleanup de consultas sin cambiar código existente
export class QueryManager {
  private abortControllers: Set<AbortController> = new Set()
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private intervals: Set<NodeJS.Timeout> = new Set()

  createAbortController(): AbortController {
    const controller = new AbortController()
    this.abortControllers.add(controller)
    return controller
  }

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      this.timeouts.delete(timeout)
      callback()
    }, delay)
    this.timeouts.add(timeout)
    return timeout
  }

  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay)
    this.intervals.add(interval)
    return interval
  }

  cleanup() {
    // Cancelar todas las consultas
    this.abortControllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    this.abortControllers.clear()

    // Limpiar timeouts
    this.timeouts.forEach((timeout) => clearTimeout(timeout))
    this.timeouts.clear()

    // Limpiar intervals
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()
  }
}
