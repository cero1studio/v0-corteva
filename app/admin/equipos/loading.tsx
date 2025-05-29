export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corteva-600"></div>
        <p className="text-lg font-medium">Cargando equipos...</p>
      </div>
    </div>
  )
}
