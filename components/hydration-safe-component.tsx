"use client"

import { useState, useEffect, type ReactNode } from "react"

interface HydrationSafeComponentProps {
  children: ReactNode | ((isMounted: boolean) => ReactNode)
  fallback?: ReactNode
  /**
   * Si es true, no renderiza nada hasta que el componente esté montado
   * @default true
   */
  waitForMount?: boolean
  /**
   * Si es true, envuelve el contenido en un div
   * @default false
   */
  useWrapper?: boolean
  /**
   * Clase CSS para el wrapper (si useWrapper es true)
   */
  wrapperClassName?: string
}

/**
 * Componente que maneja de forma segura la hidratación para evitar errores
 * de discrepancia entre servidor y cliente
 */
export function HydrationSafeComponent({
  children,
  fallback = null,
  waitForMount = true,
  useWrapper = false,
  wrapperClassName,
}: HydrationSafeComponentProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Si waitForMount es true y no está montado, mostrar fallback
  if (waitForMount && !isMounted) {
    return <>{fallback}</>
  }

  // Determinar el contenido a renderizar
  const content = typeof children === "function" ? children(isMounted) : children

  // Si useWrapper es true, envolver en un div
  if (useWrapper) {
    return (
      <div data-hydrated={isMounted} className={wrapperClassName}>
        {content}
      </div>
    )
  }

  // De lo contrario, renderizar directamente
  return <>{content}</>
}
