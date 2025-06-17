import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ReportesPage = () => {
  // Dummy data for demonstration
  const reports = [
    {
      id: 1,
      title: "Reporte de Producción Semanal",
      date: "2024-10-27",
      status: "Completado",
    },
    {
      id: 2,
      title: "Reporte de Mantenimiento Preventivo",
      date: "2024-10-26",
      status: "En Progreso",
    },
    {
      id: 3,
      title: "Reporte de Calidad del Producto",
      date: "2024-10-25",
      status: "Pendiente",
    },
  ]

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Reportes Técnicos</h1>

      <Tabs defaultValue="all" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="inProgress">En Progreso</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Reportes</CardTitle>
              <CardDescription>Visualiza y gestiona los reportes técnicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableCaption>Reportes técnicos disponibles.</TableCaption>
                <TableHead>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.id}</TableCell>
                      <TableCell>{report.title}</TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Badge>{report.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline">Ver Detalles</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Completados</CardTitle>
              <CardDescription>Visualiza los reportes técnicos completados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableCaption>Reportes técnicos completados.</TableCaption>
                <TableHead>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports
                    .filter((report) => report.status === "Completado")
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id}</TableCell>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>
                          <Badge>{report.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline">Ver Detalles</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Pendientes</CardTitle>
              <CardDescription>Visualiza los reportes técnicos pendientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableCaption>Reportes técnicos pendientes.</TableCaption>
                <TableHead>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports
                    .filter((report) => report.status === "Pendiente")
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id}</TableCell>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>
                          <Badge>{report.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline">Ver Detalles</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inProgress">
          <Card>
            <CardHeader>
              <CardTitle>Reportes En Progreso</CardTitle>
              <CardDescription>Visualiza los reportes técnicos en progreso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableCaption>Reportes técnicos en progreso.</TableCaption>
                <TableHead>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports
                    .filter((report) => report.status === "En Progreso")
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id}</TableCell>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>
                          <Badge>{report.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline">Ver Detalles</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReportesPage
