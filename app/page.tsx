import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-corteva-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/super-ganaderia-logo-black.png"
              alt="Súper Ganadería Logo"
              width={300}
              height={120}
              priority
              className="h-auto"
            />
          </div>
          <h1 className="mb-6 text-4xl font-bold text-corteva-900 md:text-5xl lg:text-6xl">Super Ganadería Concurso</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-700">
            Plataforma de competición de ventas para distribuidores y representantes
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button asChild size="lg" className="bg-corteva-600 hover:bg-corteva-700">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/ranking-publico">Ver Ranking Público</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Características Principales</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Seguimiento en Tiempo Real"
              description="Monitorea el progreso de ventas y metas en tiempo real para todos los equipos."
            />
            <FeatureCard
              title="Ranking Competitivo"
              description="Visualiza el rendimiento de los equipos en un ranking dinámico y competitivo."
            />
            <FeatureCard
              title="Gestión de Equipos"
              description="Administra equipos, zonas y distribuidores desde un panel centralizado."
            />
            <FeatureCard
              title="Reportes Detallados"
              description="Genera reportes detallados de ventas por producto, equipo y zona."
            />
            <FeatureCard
              title="Sistema de Penaltis"
              description="Implementa un sistema de penaltis para añadir emoción a la competición."
            />
            <FeatureCard
              title="Múltiples Roles"
              description="Diferentes niveles de acceso para administradores, supervisores, capitanes y representantes."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">© 2023 Súper Ganadería. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <h3 className="mb-3 text-xl font-semibold text-corteva-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
