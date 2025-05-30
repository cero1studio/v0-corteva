"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, PieChart } from "lucide-react"
import { ProtectedLayout } from "@/components/ProtectedLayout"

export default function ArbitroReportes() {
  return (
    <ProtectedLayout allowedRoles={["arbitro"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Genera y descarga reportes de la competencia</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Reporte de Rendimiento</CardTitle>
              </div>
              <CardDescription>Análisis detallado del rendimiento de equipos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Equipos analizados</span>
                  <Badge variant="secondary">24</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Período</span>
                  <Badge variant="outline">Último mes</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <CardTitle>Reporte de Ventas</CardTitle>
              </div>
              <CardDescription>Distribución de ventas por zona y producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ventas totales</span>
                  <Badge variant="secondary">1,247</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Productos</span>
                  <Badge variant="outline">15</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Reporte de Actividad</CardTitle>
              </div>
              <CardDescription>Log de actividades y eventos importantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Eventos registrados</span>
                  <Badge variant="secondary">156</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Última actualización</span>
                  <Badge variant="outline">Hoy</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Reporte Ejecutivo</CardTitle>
              </div>
              <CardDescription>Resumen ejecutivo para la dirección</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Métricas clave</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Formato</span>
                  <Badge variant="outline">PDF</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
