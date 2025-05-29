"use client"

import { use } from "react"

// Utility para resolver parámetros de Next.js 15
export function useParams<T = Record<string, string>>(params: Promise<T>): T {
  return use(params)
}

// Utility para resolver searchParams de Next.js 15
export function useSearchParams(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  return use(searchParams)
}
