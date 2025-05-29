"use client"

import type React from "react"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"

interface SafeNavigationLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  /**
   * Si es true, usa window.location.href en lugar de Link
   * @default false
   */
  forceHardNavigation?: boolean
  /**
   * Si es true, abre en una nueva pestaña
   * @default false
   */
  newTab?: boolean
  /**
   * Retraso en ms antes de navegar (útil para animaciones)
   * @default 0
   */
  delay?: number
  /**
   * Si es true, previene la navegación predeterminada
   * @default false cuando forceHardNavigation es false, true cuando es true
   */
  preventDefault?: boolean
}

/**
 * Componente de enlace que maneja la navegación de forma segura
 * Puede usar window.location.href para navegación más confiable cuando sea necesario
 */
export function SafeNavigationLink({
  href,
  children,
  className,
  onClick,
  forceHardNavigation = false,
  newTab = false,
  delay = 0,
  preventDefault,
}: SafeNavigationLinkProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Determinar si se debe prevenir la navegación predeterminada
  const shouldPreventDefault = preventDefault !== undefined ? preventDefault : forceHardNavigation

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const handleClick = async (e: React.MouseEvent) => {
    // Ejecutar onClick personalizado si existe
    if (onClick) {
      onClick(e)
    }

    // Si no es navegación forzada o nueva pestaña, dejar que Next.js maneje la navegación
    if (!forceHardNavigation && !newTab) {
      return
    }

    // Prevenir navegación predeterminada si es necesario
    if (shouldPreventDefault) {
      e.preventDefault()
    }

    // Aplicar retraso si es necesario
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    // Manejar navegación según las opciones
    if (newTab) {
      window.open(href, "_blank")
    } else if (forceHardNavigation) {
      window.location.href = href
    }
  }

  // Si no está montado y es navegación forzada, renderizar un enlace normal
  if (!isMounted && forceHardNavigation) {
    return (
      <a
        href={href}
        className={className}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    )
  }

  // Si es navegación normal, usar el componente Link de Next.js
  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
    >
      {children}
    </Link>
  )
}
