"use client"

import { useState } from "react"
import { createUser, findUserByEmail, updateUserProfile } from "@/app/actions/users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface UserImportData {
  name: string
  email: string
  password: string
  role: string
  zone: string
  distributor: string
}

const usersData: UserImportData[] = [
  // ANTIOQUIA
  {
    name: "LILIANA TAMAYO",
    email: "capiltamayo@superganaderia.com",
    password: "P@ss_antioquia_40mT",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JAIRO ANDRES CARDONA",
    email: "capijcardona@superganaderia.com",
    password: "P@ss_antioquia_LZPP",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "DIANA GONZALEZ",
    email: "capidgonzalez@superganaderia.com",
    password: "P@ss_antioquia_mzet",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "HERNEY PINTO",
    email: "capihpinto@superganaderia.com",
    password: "P@ss_antioquia_YFFM",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "LAURA LONDOÑO",
    email: "capillondono@superganaderia.com",
    password: "P@ss_antioquia_txWI",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "FELIPE TOBON",
    email: "capiftobon@superganaderia.com",
    password: "P@ss_antioquia_3zjO",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "VERONICA OLARTE",
    email: "capivolarte@superganaderia.com",
    password: "P@ss_antioquia_X1bV",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JOHAN HENAO",
    email: "capijhenao@superganaderia.com",
    password: "P@ss_antioquia_QJdN",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },
  {
    name: "GUILLERMO LONDOÑO",
    email: "capiglondono@superganaderia.com",
    password: "P@ss_antioquia_qkJA",
    role: "capitan",
    zone: "ANTIOQUIA",
    distributor: "Agralba Antioquia",
  },

  // MAG. MEDIO
  {
    name: "KAREN DELGADO",
    email: "capikdelgado@superganaderia.com",
    password: "P@ss_mag.medio_FxcF",
    role: "capitan",
    zone: "MAG. MEDIO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "REYNEL ARCILA",
    email: "capirarcila@superganaderia.com",
    password: "P@ss_mag.medio_4qdY",
    role: "capitan",
    zone: "MAG. MEDIO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "WILLINTON ZAPATA",
    email: "capiwzapata@superganaderia.com",
    password: "P@ss_mag.medio_yZFL",
    role: "capitan",
    zone: "MAG. MEDIO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "CAMILO BARRERA",
    email: "capicbarrera@superganaderia.com",
    password: "P@ss_mag.medio_BIaF",
    role: "director_tecnico",
    zone: "MAG. MEDIO",
    distributor: "Agralba Antioquia",
  },

  // SANTANDER
  {
    name: "YEISON PÁEZ",
    email: "capiypaez@superganaderia.com",
    password: "P@ss_santander_W5h0",
    role: "capitan",
    zone: "SANTANDER",
    distributor: "Agralba Santander",
  },
  {
    name: "RAFAEL VÁSQUEZ",
    email: "capirvasquez@superganaderia.com",
    password: "P@ss_santander_ApOG",
    role: "capitan",
    zone: "SANTANDER",
    distributor: "Agralba Santander",
  },
  {
    name: "YAIR VERGARA",
    email: "capiyvergara@superganaderia.com",
    password: "P@ss_santander_3DmN",
    role: "capitan",
    zone: "SANTANDER",
    distributor: "Agralba Santander",
  },
  {
    name: "JORDAN MOGOLLON",
    email: "capijmogollon@superganaderia.com",
    password: "P@ss_santander_ZoIs",
    role: "capitan",
    zone: "SANTANDER",
    distributor: "Agralba Santander",
  },
  {
    name: "FELIPE ARIZA",
    email: "capifariza@superganaderia.com",
    password: "P@ss_santander_YIxG",
    role: "capitan",
    zone: "SANTANDER",
    distributor: "Agralba Santander",
  },
  {
    name: "JAIRO CAMACHO",
    email: "capijcamacho@superganaderia.com",
    password: "P@ss_santander_R93f",
    role: "director_tecnico",
    zone: "SANTANDER",
    distributor: "Agralba Santander",
  },

  // CARIBE HUMEDO
  {
    name: "ALVARO URIBE",
    email: "capiauribe@superganaderia.com",
    password: "P@ss_caribehumedo_B3rM",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JOSE G BULA",
    email: "capijbula@superganaderia.com",
    password: "P@ss_caribehumedo_MPuf",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "AURA DOMINGUEZ",
    email: "capiadominguez@superganaderia.com",
    password: "P@ss_caribehumedo_qiZI",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "WILMAR MARTINEZ",
    email: "capiwmartinez@superganaderia.com",
    password: "P@ss_caribehumedo_MlRE",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "GILDARDO CASTRO",
    email: "capigcastro@superganaderia.com",
    password: "P@ss_caribehumedo_FadA",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JUAN FERNANDO ESPINOZA",
    email: "capijespinoza@superganaderia.com",
    password: "P@ss_caribehumedo_VOBJ",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "ARNOLD FLOREZ",
    email: "capiaflorez1@superganaderia.com",
    password: "P@ss_caribehumedo_AQQy",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "EDWIN ARRIETA",
    email: "capiearrieta@superganaderia.com",
    password: "P@ss_caribehumedo_zD6F",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "WENDY MONTERROSA",
    email: "capiwmonterrosa@superganaderia.com",
    password: "P@ss_caribehumedo_DCw3",
    role: "capitan",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "NICOLAS QUINTERO",
    email: "capinquintero@superganaderia.com",
    password: "P@ss_caribehumedo_o4Vk",
    role: "director_tecnico",
    zone: "CARIBE HUMEDO",
    distributor: "Agralba Antioquia",
  },

  // CARIBE SECO
  {
    name: "ANA RUBY LOPEZ",
    email: "capialopez@superganaderia.com",
    password: "P@ss_caribeseco_sDb9",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JANER PAYARES",
    email: "capijpayares@superganaderia.com",
    password: "P@ss_caribeseco_C22j",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "ANA ISABEL FERNANDEZ",
    email: "capiafernandez@superganaderia.com",
    password: "P@ss_caribeseco_ATpv",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "CARLOS MEZA",
    email: "capicmeza@superganaderia.com",
    password: "P@ss_caribeseco_U9Rg",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JOSE GREGORIO FLOREZ",
    email: "capijflorez@superganaderia.com",
    password: "P@ss_caribeseco_QDO8",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "TULIO FARELO",
    email: "capitfarelo@superganaderia.com",
    password: "P@ss_caribeseco_ZOC4",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JOSELIN NADJAR",
    email: "capijnadjar@superganaderia.com",
    password: "P@ss_caribeseco_Crj2",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "KELLY CONSUEGRA",
    email: "capikconsuegra@superganaderia.com",
    password: "P@ss_caribeseco_S9ia",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "ANGELICA MOLINA",
    email: "capiamolina@superganaderia.com",
    password: "P@ss_caribeseco_C5jZ",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "JUAN CARLOS CABALLERO",
    email: "capijcaballero@superganaderia.com",
    password: "P@ss_caribeseco_053h",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "LENIN ZAPATA",
    email: "capilzapata@superganaderia.com",
    password: "P@ss_caribeseco_E1dJ",
    role: "capitan",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
  {
    name: "ALAN FLOREZ",
    email: "capiaflorez@superganaderia.com",
    password: "P@ss_caribeseco_hJTM",
    role: "director_tecnico",
    zone: "CARIBE SECO",
    distributor: "Agralba Antioquia",
  },
]

type ResultType = {
  user: UserImportData
  success: boolean
  action: "created" | "updated" | "skipped"
  error?: string
}

export default function ImportarUsuariosPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ResultType[]>([])
  const [currentUser, setCurrentUser] = useState<string>("")
  const [mode, setMode] = useState<"create" | "update" | "both">("both")
  const [updateOnlyMissing, setUpdateOnlyMissing] = useState(true)
  const { toast } = useToast()

  async function handleProcess() {
    setIsProcessing(true)
    setProgress(0)
    setResults([])

    const totalUsers = usersData.length
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < totalUsers; i++) {
      const user = usersData[i]
      setCurrentUser(user.name)

      try {
        // Verificar si el usuario ya existe
        const { data: existingUser, error: findError } = await findUserByEmail(user.email)

        if (findError) {
          setResults((prev) => [
            ...prev,
            { user, success: false, action: "skipped", error: `Error al buscar usuario: ${findError}` },
          ])
          errors++
          continue
        }

        if (existingUser) {
          // El usuario existe, actualizar si está en modo "update" o "both"
          if (mode === "create") {
            setResults((prev) => [
              ...prev,
              { user, success: true, action: "skipped", error: "Usuario ya existe y modo es solo creación" },
            ])
            skipped++
          } else {
            // Verificar si necesita actualización
            const needsZoneUpdate = !existingUser.zone_id
            const needsDistributorUpdate = !existingUser.distributor_id
            const needsUpdate = !updateOnlyMissing || needsZoneUpdate || needsDistributorUpdate

            if (needsUpdate) {
              const result = await updateUserProfile(existingUser.id, {
                fullName: user.name,
                role: user.role,
                zoneId: user.zone,
                distributorId: user.distributor,
              })

              if (result.error) {
                setResults((prev) => [...prev, { user, success: false, action: "updated", error: result.error }])
                errors++
              } else {
                setResults((prev) => [...prev, { user, success: true, action: "updated" }])
                updated++
              }
            } else {
              setResults((prev) => [
                ...prev,
                { user, success: true, action: "skipped", error: "Usuario ya tiene todos los datos" },
              ])
              skipped++
            }
          }
        } else {
          // El usuario no existe, crear si está en modo "create" o "both"
          if (mode === "update") {
            setResults((prev) => [
              ...prev,
              { user, success: true, action: "skipped", error: "Usuario no existe y modo es solo actualización" },
            ])
            skipped++
          } else {
            // Crear FormData como lo hace el formulario normal
            const formData = new FormData()
            formData.append("email", user.email)
            formData.append("password", user.password)
            formData.append("fullName", user.name)
            formData.append("role", user.role)
            formData.append("zoneId", user.zone)
            formData.append("distributorId", user.distributor)

            const result = await createUser(formData)

            if (result.error) {
              setResults((prev) => [...prev, { user, success: false, action: "created", error: result.error }])
              errors++
            } else {
              setResults((prev) => [...prev, { user, success: true, action: "created" }])
              created++
            }
          }
        }
      } catch (error: any) {
        setResults((prev) => [...prev, { user, success: false, action: "skipped", error: error.message }])
        errors++
      }

      setProgress(((i + 1) / totalUsers) * 100)

      // Pequeña pausa para no sobrecargar el servidor
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsProcessing(false)
    setCurrentUser("")

    toast({
      title: "Proceso completado",
      description: `Creados: ${created}, Actualizados: ${updated}, Omitidos: ${skipped}, Errores: ${errors}`,
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "updated":
        return <RefreshCw className="h-5 w-5 text-blue-500" />
      case "skipped":
        return <XCircle className="h-5 w-5 text-gray-400" />
      default:
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <Button variant="outline" asChild>
          <Link href="/admin/usuarios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importación y Actualización de Usuarios</CardTitle>
          <CardDescription>
            Esta herramienta permite crear nuevos usuarios y actualizar usuarios existentes con sus zonas y
            distribuidores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isProcessing && results.length === 0 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Usuarios a procesar:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• ANTIOQUIA: 9 capitanes</p>
                  <p>• MAG. MEDIO: 3 capitanes + 1 director técnico</p>
                  <p>• SANTANDER: 5 capitanes + 1 director técnico</p>
                  <p>• CARIBE HÚMEDO: 9 capitanes + 1 director técnico</p>
                  <p>• CARIBE SECO: 11 capitanes + 1 director técnico</p>
                </div>
              </div>

              <Tabs defaultValue="both" className="w-full" onValueChange={(v) => setMode(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="both">Crear y Actualizar</TabsTrigger>
                  <TabsTrigger value="create">Solo Crear Nuevos</TabsTrigger>
                  <TabsTrigger value="update">Solo Actualizar Existentes</TabsTrigger>
                </TabsList>
                <TabsContent value="both" className="p-4 border rounded-md mt-2">
                  <p className="text-sm text-muted-foreground">
                    Este modo creará usuarios nuevos y actualizará los existentes con la información correcta de zona y
                    distribuidor.
                  </p>
                </TabsContent>
                <TabsContent value="create" className="p-4 border rounded-md mt-2">
                  <p className="text-sm text-muted-foreground">
                    Este modo solo creará usuarios nuevos y omitirá los que ya existen en el sistema.
                  </p>
                </TabsContent>
                <TabsContent value="update" className="p-4 border rounded-md mt-2">
                  <p className="text-sm text-muted-foreground">
                    Este modo solo actualizará usuarios existentes y omitirá la creación de nuevos usuarios.
                  </p>
                </TabsContent>
              </Tabs>

              {(mode === "update" || mode === "both") && (
                <div className="flex items-center space-x-2 mt-4">
                  <Switch id="update-missing" checked={updateOnlyMissing} onCheckedChange={setUpdateOnlyMissing} />
                  <Label htmlFor="update-missing">Solo actualizar usuarios que les falte zona o distribuidor</Label>
                </div>
              )}

              <Button onClick={handleProcess} className="w-full" size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Iniciar Proceso ({usersData.length} usuarios)
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>

              {currentUser && (
                <div className="text-center text-sm text-muted-foreground">Procesando: {currentUser}</div>
              )}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Resultados:</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      !result.success ? "border-red-200 bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {getActionIcon(result.action)}
                      <div>
                        <div className="font-medium">{result.user.name}</div>
                        <div className="text-sm text-muted-foreground">{result.user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {result.user.zone} - {result.user.role}
                      </div>
                      <div className="text-xs">
                        {result.action === "created" && "Creado"}
                        {result.action === "updated" && "Actualizado"}
                        {result.action === "skipped" && "Omitido"}
                      </div>
                      {result.error && <div className="text-xs text-red-500">{result.error}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Resumen:</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600">
                    Creados: {results.filter((r) => r.action === "created" && r.success).length}
                  </span>
                  <span className="text-blue-600">
                    Actualizados: {results.filter((r) => r.action === "updated" && r.success).length}
                  </span>
                  <span className="text-gray-600">
                    Omitidos: {results.filter((r) => r.action === "skipped").length}
                  </span>
                  <span className="text-red-600">Errores: {results.filter((r) => !r.success).length}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
