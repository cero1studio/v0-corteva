import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Trophy, Info, AlertTriangle, Package, User, Bell, Settings } from "lucide-react"

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-10 flex items-center gap-4">
        <Image src="/corteva-logo.png" alt="Corteva Logo" width={180} height={60} className="h-auto" />
        <div>
          <h1 className="text-3xl font-bold">Sistema de Diseño</h1>
          <p className="text-muted-foreground">Plataforma Super Ganadería</p>
        </div>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="mb-6">
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="typography">Tipografía</TabsTrigger>
          <TabsTrigger value="spacing">Espaciado</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="examples">Ejemplos</TabsTrigger>
        </TabsList>

        {/* COLORES */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Colores</CardTitle>
              <CardDescription>
                Colores oficiales de Corteva para mantener la consistencia visual en toda la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Color Principal</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-20 rounded-md bg-[#0072ce]"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Corteva Blue</span>
                      <span className="font-mono text-sm">#0072ce</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Color principal de la marca Corteva.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Escala de Azules</h3>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-50"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">50</span>
                      <span className="font-mono text-sm">#e6f1ff</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-100"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">100</span>
                      <span className="font-mono text-sm">#cce3ff</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-200"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">200</span>
                      <span className="font-mono text-sm">#99c7ff</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-300"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">300</span>
                      <span className="font-mono text-sm">#66abff</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-400"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">400</span>
                      <span className="font-mono text-sm">#338fff</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">500</span>
                      <span className="font-mono text-sm">#0072ce</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-600"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">600</span>
                      <span className="font-mono text-sm">#005ba5</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-700"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">700</span>
                      <span className="font-mono text-sm">#00447c</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-800"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">800</span>
                      <span className="font-mono text-sm">#002e52</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-900"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">900</span>
                      <span className="font-mono text-sm">#001729</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Colores Complementarios</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-gray-200"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Gris Neutro</span>
                      <span className="font-mono text-sm">#e5e7eb</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-amber-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Ámbar</span>
                      <span className="font-mono text-sm">#f59e0b</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-purple-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Púrpura</span>
                      <span className="font-mono text-sm">#a855f7</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-red-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Rojo</span>
                      <span className="font-mono text-sm">#ef4444</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Colores de Estado</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-400"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Éxito</span>
                      <span className="font-mono text-sm">#338fff</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-amber-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Advertencia</span>
                      <span className="font-mono text-sm">#f59e0b</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-red-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Error</span>
                      <span className="font-mono text-sm">#ef4444</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 h-12 rounded-md bg-corteva-500"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Información</span>
                      <span className="font-mono text-sm">#0072ce</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIPOGRAFÍA */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
              <CardDescription>
                Sistema tipográfico para mantener la legibilidad y jerarquía visual en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Fuente Principal</h3>
                <p className="mb-2">
                  Inter es una fuente sans-serif moderna diseñada para pantallas digitales con excelente legibilidad.
                </p>
                <div className="rounded-lg border p-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Heading 1</span>
                      <h1 className="text-4xl font-bold">Título Principal</h1>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Heading 2</span>
                      <h2 className="text-3xl font-bold">Título Secundario</h2>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Heading 3</span>
                      <h3 className="text-2xl font-bold">Título Terciario</h3>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Heading 4</span>
                      <h4 className="text-xl font-bold">Título Cuaternario</h4>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Párrafo</span>
                      <p className="text-base">
                        Este es un ejemplo de texto de párrafo. La plataforma Super Ganadería de Corteva utiliza una
                        tipografía clara y legible para mejorar la experiencia del usuario.
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Texto pequeño</span>
                      <p className="text-sm">Este es un ejemplo de texto pequeño para información secundaria.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Pesos Tipográficos</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">Regular (400)</span>
                    <p className="text-lg font-normal">Texto en peso regular</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">Medium (500)</span>
                    <p className="text-lg font-medium">Texto en peso medio</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">Semibold (600)</span>
                    <p className="text-lg font-semibold">Texto en peso semibold</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">Bold (700)</span>
                    <p className="text-lg font-bold">Texto en peso bold</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <span className="text-sm text-muted-foreground">Extrabold (800)</span>
                    <p className="text-lg font-extrabold">Texto en peso extrabold</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESPACIADO */}
        <TabsContent value="spacing">
          <Card>
            <CardHeader>
              <CardTitle>Espaciado</CardTitle>
              <CardDescription>
                Sistema de espaciado consistente para mantener la armonía visual en la interfaz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Escala de Espaciado</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 bg-corteva-500"></div>
                    <span className="font-medium">4px (0.25rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado mínimo, separación de iconos</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 bg-corteva-500"></div>
                    <span className="font-medium">8px (0.5rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado pequeño, padding interno</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-corteva-500"></div>
                    <span className="font-medium">12px (0.75rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado medio-pequeño</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-corteva-500"></div>
                    <span className="font-medium">16px (1rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado base, separación de elementos</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-corteva-500"></div>
                    <span className="font-medium">24px (1.5rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado medio, separación de secciones</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-corteva-500"></div>
                    <span className="font-medium">32px (2rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado grande, márgenes de contenedores</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 bg-corteva-500"></div>
                    <span className="font-medium">48px (3rem)</span>
                    <span className="text-sm text-muted-foreground">Espaciado extra grande, separación de módulos</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Aplicación del Espaciado</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Espaciado Interno (Padding)</h4>
                    <div className="rounded-md border border-dashed border-corteva-300 p-4">
                      <div className="rounded bg-corteva-100 p-2">Padding pequeño (8px)</div>
                    </div>
                    <div className="mt-4 rounded-md border border-dashed border-corteva-300 p-6">
                      <div className="rounded bg-corteva-100 p-4">Padding medio (16px)</div>
                    </div>
                    <div className="mt-4 rounded-md border border-dashed border-corteva-300 p-8">
                      <div className="rounded bg-corteva-100 p-6">Padding grande (24px)</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Espaciado Entre Elementos (Gap)</h4>
                    <div className="flex flex-col gap-2">
                      <div className="rounded bg-corteva-100 p-2">Gap pequeño (8px)</div>
                      <div className="rounded bg-corteva-100 p-2">Entre estos elementos</div>
                    </div>
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="rounded bg-corteva-100 p-2">Gap medio (16px)</div>
                      <div className="rounded bg-corteva-100 p-2">Entre estos elementos</div>
                    </div>
                    <div className="mt-4 flex flex-col gap-6">
                      <div className="rounded bg-corteva-100 p-2">Gap grande (24px)</div>
                      <div className="rounded bg-corteva-100 p-2">Entre estos elementos</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPONENTES */}
        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Componentes</CardTitle>
              <CardDescription>Componentes básicos del sistema de diseño con los colores de Corteva.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Botones</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Button className="w-full bg-corteva-500 hover:bg-corteva-600">Primario</Button>
                    <p className="text-xs text-muted-foreground">Acción principal</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Secundario
                    </Button>
                    <p className="text-xs text-muted-foreground">Acción secundaria</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full">
                      Ghost
                    </Button>
                    <p className="text-xs text-muted-foreground">Acción terciaria</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="destructive" className="w-full">
                      Destructivo
                    </Button>
                    <p className="text-xs text-muted-foreground">Acción peligrosa</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Button size="lg" className="w-full bg-corteva-500 hover:bg-corteva-600">
                      Grande
                    </Button>
                    <p className="text-xs text-muted-foreground">Botón grande</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-corteva-500 hover:bg-corteva-600">Normal</Button>
                    <p className="text-xs text-muted-foreground">Botón normal</p>
                  </div>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full bg-corteva-500 hover:bg-corteva-600">
                      Pequeño
                    </Button>
                    <p className="text-xs text-muted-foreground">Botón pequeño</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Campos de Formulario</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disabled">Deshabilitado</Label>
                    <Input id="disabled" disabled placeholder="Campo deshabilitado" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="terms">Aceptar términos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="terms" />
                      <Label htmlFor="terms">Acepto los términos y condiciones</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <Badge className="bg-corteva-500 hover:bg-corteva-600">Default</Badge>
                    <p className="text-xs text-muted-foreground">Badge estándar</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary">Secondary</Badge>
                    <p className="text-xs text-muted-foreground">Badge secundario</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Outline</Badge>
                    <p className="text-xs text-muted-foreground">Badge outline</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="destructive">Destructive</Badge>
                    <p className="text-xs text-muted-foreground">Badge destructivo</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Alertas</h3>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Información</AlertTitle>
                    <AlertDescription>Esta es una alerta informativa con el estilo por defecto.</AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Esta es una alerta de error con estilo destructivo.</AlertDescription>
                  </Alert>
                  <Alert className="border-corteva-500 bg-corteva-50 text-corteva-500">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Corteva</AlertTitle>
                    <AlertDescription>Esta es una alerta personalizada con los colores de Corteva.</AlertDescription>
                  </Alert>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Cards</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Título de la Card</CardTitle>
                      <CardDescription>Descripción de la card con información adicional.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Este es el contenido principal de la card.</p>
                    </CardContent>
                    <CardFooter>
                      <Button className="bg-corteva-500 hover:bg-corteva-600">Acción</Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader className="bg-corteva-500 text-white">
                      <CardTitle>Card con Corteva</CardTitle>
                      <CardDescription className="text-corteva-100">
                        Card con encabezado en color Corteva.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p>Este es el contenido principal de la card.</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline">Cancelar</Button>
                      <Button className="ml-2 bg-corteva-500 hover:bg-corteva-600">Aceptar</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EJEMPLOS */}
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Ejemplos de Aplicación</CardTitle>
              <CardDescription>Ejemplos de cómo aplicar el sistema de diseño en diferentes contextos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Tarjeta de Producto</h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-corteva-500">Herbicida</Badge>
                        <Badge variant="outline" className="text-corteva-500">
                          <Trophy className="mr-1 h-3 w-3" />2 Goles
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">Rinskor™ Active</CardTitle>
                      <CardDescription>Herbicida de amplio espectro</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio:</span>
                        <span className="font-medium">$1,250.00</span>
                      </div>
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">Stock:</span>
                        <span className="font-medium">120 unidades</span>
                      </div>
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">Puntos:</span>
                        <span className="font-medium text-corteva-500">5 puntos</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-corteva-500 hover:bg-corteva-600">Ver Detalles</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Panel de Navegación</h3>
                <div className="rounded-lg border">
                  <div className="flex h-14 items-center border-b px-4">
                    <div className="flex items-center gap-2">
                      <Image src="/corteva-logo.png" alt="Corteva Logo" width={120} height={40} className="h-auto" />
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <User className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-64 border-r p-4">
                      <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start">
                          <Package className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                        <Button variant="ghost" className="w-full justify-start bg-corteva-50 text-corteva-500">
                          <Package className="mr-2 h-4 w-4" />
                          Productos
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Usuarios
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <Trophy className="mr-2 h-4 w-4" />
                          Ranking
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Configuración
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <h2 className="text-2xl font-bold">Productos</h2>
                      <p className="text-muted-foreground">Gestión de productos de Corteva</p>
                      <Separator className="my-4" />
                      <div className="rounded-lg border p-4">
                        <p className="text-center text-muted-foreground">Contenido del panel</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Celebración de Gol</h3>
                <div className="rounded-lg border p-6">
                  <Card className="mx-auto max-w-md overflow-hidden">
                    <CardHeader className="bg-corteva-500 text-white text-center pb-6 pt-8">
                      <CardTitle className="text-2xl font-bold">¡GOOOOOL!</CardTitle>
                      <CardDescription className="text-white/90 text-lg">¡Has metido 2 goles!</CardDescription>
                    </CardHeader>
                    <CardContent className="relative flex flex-col items-center justify-center p-6 pt-10">
                      <div className="relative">
                        <Image
                          src="/soccer-ball.png"
                          alt="Balón de fútbol"
                          width={100}
                          height={100}
                          className="h-auto"
                        />
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-lg font-medium">
                          ¡Felicidades por tu venta de{" "}
                          <span className="font-bold text-corteva-500">Rinskor™ Active</span>!
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Sigue así para alcanzar tus metas y subir en el ranking.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-6">
                      <Button className="bg-corteva-500 hover:bg-corteva-600">¡Seguir compitiendo!</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
