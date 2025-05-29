import type React from "react"
// Utilidades de compatibilidad para Next.js 15
import { use } from "react"

// Wrapper para manejar parámetros async en componentes
export function withAsyncParams<T extends Record<string, any>>(
  Component: React.ComponentType<{ params: T; searchParams?: any }>,
) {
  return function WrappedComponent({
    params,
    searchParams,
    ...props
  }: {
    params: Promise<T>
    searchParams?: Promise<any>
    [key: string]: any
  }) {
    const resolvedParams = use(params)
    const resolvedSearchParams = searchParams ? use(searchParams) : undefined

    return <Component params={resolvedParams} searchParams={resolvedSearchParams} {...props} />
  }
}

// Hook para usar parámetros de forma segura
export function useSafeParams<T = Record<string, string>>(params: Promise<T> | T): T {
  if (params instanceof Promise) {
    return use(params)
  }
  return params
}
