"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, RefreshCw, Users, CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { syncAllUsersWithAuth } from "@/app/actions/users"

interface SyncResult {
  email: string
  action: "created" | "updated" | "skipped" | "partial"
  newId?: string
  tempPassword?: string
  message?: string
  error?: string
}

interface SyncStats {
  total: number
  created: number
  updated: number
  errors: number
  skipped: number
  partial: number
}

export default function SincronizarUsuariosPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<SyncResult[]>([])
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const { toast } = useToast()

  async function handleSync() {
    setIsRunning(true)
    setResults([])
    setStats(null)
    setErrors([])

    try {
      console.log("Iniciando sincronización...")

      const result = await syncAllUsersWithAuth()

      if (result.error) {
        throw new Error(result.error)
      }

      setStats(result.stats)
      setResults(result.results || [])
      setErrors(result.errors || [])

      toast({
        title: "Sincronización completada",
        description: result.message,
      })
    } catch (error: any) {
      console.error("Error en sincronización:", error)
      toast({
        title: "Error",
        description: error.message || "Error al sincronizar usuarios",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sincronizar Usuarios</h2>
        <Button variant="outline" asChild>
          <Link href="/admin/usuarios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sincronización con Sistema de Autenticación
          </CardTitle>
          <CardDescription>
            Esta herramienta verifica todos los usuarios en la base de datos y los sincroniza con el sistema de
            autenticación de Supabase. Si un usuario no existe en auth, se creará automáticamente con una contraseña
            temporal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">¿Qué hace esta sincronización?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verifica cada usuario en la tabla profiles</li>
              <li>• Comprueba si existe en el sistema de autenticación</li>
              <li>• Crea usuarios faltantes con contraseñas temporales</li>
              <li>• Actualiza información de usuarios existentes</li>
              <li>• Proporciona un reporte detallado de los cambios</li>
            </ul>
          </div>

          <Button onClick={handleSync} disabled={isRunning} className="w-full" size="lg">
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando usuarios...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Iniciar Sincronización
              </>
            )}
          </Button>

          {stats && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Resultados de la Sincronización</h3>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{stats.created}</div>
                  <div className="text-sm text-green-600">Creados</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{stats.updated}</div>
                  <div className="text-sm text-blue-600">Actualizados</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-700">{stats.partial}</div>
                  <div className="text-sm text-yellow-600">Parciales</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-700">{stats.errors}</div>
                  <div className="text-sm text-red-600">Errores</div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-700">{stats.skipped}</div>
                  <div className="text-sm text-gray-600">Sin cambios</div>
                </div>
              </div>

              <Button variant="outline" onClick={() => setShowDetails(!showDetails)} className="w-full">
                {showDetails ? "Ocultar" : "Mostrar"} Detalles
              </Button>

              {showDetails && (
                <div className="space-y-4">
                  {/* Usuarios creados */}
                  {results.filter((r) => r.action === "created").length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Usuarios Creados ({results.filter((r) => r.action === "created").length})
                      </h4>
                      <div className="bg-green-50 p-3 rounded-lg space-y-2">
                        {results
                          .filter((r) => r.action === "created")
                          .map((result, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium">{result.email}</div>
                              {result.tempPassword && (
                                <div className="text-green-600">Contraseña temporal: {result.tempPassword}</div>
                              )}
                              {result.newId && result.newId !== result.email && (
                                <div className="text-green-600">Nuevo ID: {result.newId}</div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Usuarios actualizados */}
                  {results.filter((r) => r.action === "updated").length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Usuarios Actualizados ({results.filter((r) => r.action === "updated").length})
                      </h4>
                      <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                        {results
                          .filter((r) => r.action === "updated")
                          .map((result, index) => (
                            <div key={index} className="text-sm font-medium">
                              {result.email}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Usuarios parcialmente sincronizados */}
                  {results.filter((r) => r.action === "partial").length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Sincronización Parcial ({results.filter((r) => r.action === "partial").length})
                      </h4>
                      <div className="bg-yellow-50 p-3 rounded-lg space-y-2">
                        {results
                          .filter((r) => r.action === "partial")
                          .map((result, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium">{result.email}</div>
                              <div className="text-yellow-700">{result.message}</div>
                              {result.error && <div className="text-yellow-600 text-xs">Error: {result.error}</div>}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Errores */}
                  {errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Errores ({errors.length})
                      </h4>
                      <div className="bg-red-50 p-3 rounded-lg space-y-1">
                        {errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usuarios sin cambios */}
                  {results.filter((r) => r.action === "skipped").length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Sin Cambios ({results.filter((r) => r.action === "skipped").length})
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                        {results
                          .filter((r) => r.action === "skipped")
                          .slice(0, 10)
                          .map((result, index) => (
                            <div key={index} className="text-sm">
                              {result.email}
                            </div>
                          ))}
                        {results.filter((r) => r.action === "skipped").length > 10 && (
                          <div className="text-sm text-gray-600">
                            ... y {results.filter((r) => r.action === "skipped").length - 10} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
