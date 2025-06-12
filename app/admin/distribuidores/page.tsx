"use client"

import { getAllDistributors } from "@/actions/distributor-actions"
import type { Distributor } from "@/types"
import { useEffect, useState } from "react"

const DistributorsPage = () => {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let mounted = true
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        setError("La carga está tardando mucho. Intenta recargar la página.")
        setIsLoading(false)
      }
    }, 5000)

    const loadDistributors = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAllDistributors()
        if (mounted) {
          setDistributors(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError("Error al cargar distribuidores")
          setIsLoading(false)
        }
      }
    }

    loadDistributors()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount((prevCount) => prevCount + 1)
  }

  if (isLoading) {
    return <div>Cargando distribuidores...</div>
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={handleRetry}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Distribuidores</h1>
      <ul>
        {distributors.map((distributor) => (
          <li key={distributor.id}>{distributor.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default DistributorsPage
