"use client"

import { useState } from "react"
import { Download, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportSalesChart } from "@/components/report-sales-chart"
import { ReportProductsChart } from "@/components/report-products-chart"

export default function ReportesPage() {
  const [reportType, setReportType] = useState("sales")
  const [dateRange, setDateRange] = useState("week")

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
          <p className="text-muted-foreground">Genera y exporta reportes de tu zona</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Exportar a Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Exportar a PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>Selecciona los parámetros para generar tu reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="clients">Clientes Captados</SelectItem>
                  <SelectItem value="products">Productos</SelectItem>
                  <SelectItem value="teams">Equipos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  <SelectItem value="a">Producto A</SelectItem>
                  <SelectItem value="b">Producto B</SelectItem>
                  <SelectItem value="c">Producto C</SelectItem>
                  <SelectItem value="d">Producto D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipo</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los equipos</SelectItem>
                  <SelectItem value="1">Los Campeones</SelectItem>
                  <SelectItem value="2">Equipo Estrella</SelectItem>
                  <SelectItem value="3">Los Guerreros</SelectItem>
                  <SelectItem value="4">Equipo Fuerte</SelectItem>
                  <SelectItem value="5">Los Tigres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <div className="flex">
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Fin</label>
                <div className="flex">
                  <Input type="date" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="bg-corteva-600 hover:bg-corteva-700">Generar Reporte</Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="table">Tabla</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "sales" && "Reporte de Ventas"}
                {reportType === "clients" && "Reporte de Clientes Captados"}
                {reportType === "products" && "Reporte de Productos"}
                {reportType === "teams" && "Reporte de Equipos"}
              </CardTitle>
              <CardDescription>
                {dateRange === "week" && "Datos de la semana actual"}
                {dateRange === "month" && "Datos del mes actual"}
                {dateRange === "quarter" && "Datos del trimestre actual"}
                {dateRange === "year" && "Datos del año actual"}
                {dateRange === "custom" && "Datos del periodo personalizado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {reportType === "sales" && <ReportSalesChart />}
              {reportType === "products" && <ReportProductsChart />}
              {(reportType === "clients" || reportType === "teams") && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Selecciona un tipo de reporte para visualizar los datos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "sales" && "Reporte de Ventas"}
                {reportType === "clients" && "Reporte de Clientes Captados"}
                {reportType === "products" && "Reporte de Productos"}
                {reportType === "teams" && "Reporte de Equipos"}
              </CardTitle>
              <CardDescription>
                {dateRange === "week" && "Datos de la semana actual"}
                {dateRange === "month" && "Datos del mes actual"}
                {dateRange === "quarter" && "Datos del trimestre actual"}
                {dateRange === "year" && "Datos del año actual"}
                {dateRange === "custom" && "Datos del periodo personalizado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportType === "sales" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Kg/Litros</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>2023-05-01</TableCell>
                      <TableCell>Los Campeones</TableCell>
                      <TableCell>Producto A</TableCell>
                      <TableCell className="text-right">10</TableCell>
                      <TableCell className="text-right">25</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">12.5</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2023-05-03</TableCell>
                      <TableCell>Equipo Estrella</TableCell>
                      <TableCell>Producto C</TableCell>
                      <TableCell className="text-right">5</TableCell>
                      <TableCell className="text-right">16</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">16</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2023-05-05</TableCell>
                      <TableCell>Los Guerreros</TableCell>
                      <TableCell>Producto B</TableCell>
                      <TableCell className="text-right">8</TableCell>
                      <TableCell className="text-right">14.4</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">10.8</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              {reportType === "products" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Producto A</TableCell>
                      <TableCell className="text-right">187</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">468</TableCell>
                      <TableCell className="text-right">38.7%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Producto B</TableCell>
                      <TableCell className="text-right">142</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">320</TableCell>
                      <TableCell className="text-right">25.0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Producto C</TableCell>
                      <TableCell className="text-right">98</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">294</TableCell>
                      <TableCell className="text-right">22.6%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Producto D</TableCell>
                      <TableCell className="text-right">116</TableCell>
                      <TableCell className="text-right font-medium text-corteva-600">163</TableCell>
                      <TableCell className="text-right">13.7%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
