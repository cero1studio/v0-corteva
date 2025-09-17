"use client"

// Mejorar el componente de error de conexión para mostrar opciones de recuperación
// Añadir la opción de usar datos en caché cuando sea posible

// Importar las funciones necesarias
import { hasCachedSession } from "@/lib/session-cache"
import { isOnline } from "@/lib/network-status"

// Modificar el componente para incluir más opciones de recuperación
export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  const hasCache = hasCachedSession()
  const online = isOnline()

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-lg border border-red-200">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="p-3 bg-red-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Error de conexión</h2>
          <p className="text-gray-600">
            {!online
              ? "No hay conexión a internet. Verifica tu red y vuelve a intentarlo."
              : "No se pudo conectar con el servidor. Por favor, intenta nuevamente más tarde."}
          </p>

          {hasCache && (
            <div className="p-4 mt-2 text-sm text-blue-800 bg-blue-50 rounded-md">
              <p>Hay datos guardados localmente que puedes usar mientras tanto.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1"
            >
              Reintentar
            </button>

            {hasCache && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1"
              >
                Usar datos guardados
              </button>
            )}

            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex-1"
            >
              Ir al login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
