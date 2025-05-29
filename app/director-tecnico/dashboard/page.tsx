// Agregar el AuthGuard al dashboard de director técnico
// Importar el AuthGuard
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Envolver el contenido de la página con AuthGuard
export default function DirectorTecnicoDashboardPage() {
  return (
    <AuthGuard allowedRoles={["director_tecnico"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard de Director Técnico</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Rendimiento por Zona</CardTitle>
              <CardDescription>Visualiza el rendimiento de las zonas bajo tu dirección</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Zona Norte", ventas: 4000, meta: 5000 },
                      { name: "Zona Sur", ventas: 3000, meta: 4000 },
                      { name: "Zona Este", ventas: 2000, meta: 3000 },
                      { name: "Zona Oeste", ventas: 2780, meta: 3500 },
                      { name: "Zona Central", ventas: 1890, meta: 2500 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ventas" fill="#8884d8" name="Ventas Actuales" />
                    <Bar dataKey="meta" fill="#82ca9d" name="Meta Mensual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zonas Destacadas</CardTitle>
              <CardDescription>Las zonas con mejor desempeño este mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <span className="font-medium">Zona Norte</span>
                  </div>
                  <span className="font-bold">80% de meta</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <span className="font-medium">Zona Oeste</span>
                  </div>
                  <span className="font-bold">79% de meta</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <span className="font-medium">Zona Sur</span>
                  </div>
                  <span className="font-bold">75% de meta</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>Los productos con mayor volumen de ventas en todas las zonas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Producto A", value: 400 },
                        { name: "Producto B", value: 300 },
                        { name: "Producto C", value: 300 },
                        { name: "Producto D", value: 200 },
                        { name: "Otros", value: 100 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Producto A", value: 400 },
                        { name: "Producto B", value: 300 },
                        { name: "Producto C", value: 300 },
                        { name: "Producto D", value: 200 },
                        { name: "Otros", value: 100 },
                      ].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"][index % 5]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
