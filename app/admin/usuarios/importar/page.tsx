"use client"

import { useState, useEffect, useRef } from "react"
import { createUser, findUserByEmail, updateUserProfile } from "@/app/actions/users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, CheckCircle, XCircle, RefreshCw, Download, FileText } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase/client"

interface UserImportData {
  Nombre: string
  Email: string
  Rol: string
  Zona: string
  Distribuidor: string
  Vendedor?: string
  Tecnico?: string
}

type ResultType = {
  user: UserImportData
  success: boolean
  action: "created" | "updated" | "skipped" | "error"
  error?: string
}

export default function ImportarUsuariosPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ResultType[]>([])
  const [currentUser, setCurrentUser] = useState<string>("")
  const [mode, setMode] = useState<"create" | "update" | "both">("both")
  const [updateOnlyMissing, setUpdateOnlyMissing] = useState(true)
  
  const [usersData, setUsersData] = useState<UserImportData[]>([])
  const [fileSelected, setFileSelected] = useState<File | null>(null)
  
  // Database references
  const [zones, setZones] = useState<any[]>([])
  const [distributors, setDistributors] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load reference data to map names to IDs
    const loadReferences = async () => {
      const [zonesRes, distRes, teamsRes] = await Promise.all([
        supabase.from("zones").select("id, name"),
        supabase.from("distributors").select("id, name"),
        supabase.from("teams").select("id, name")
      ])

      if (zonesRes.data) setZones(zonesRes.data)
      if (distRes.data) setDistributors(distRes.data)
      if (teamsRes.data) setTeams(teamsRes.data)
    }

    loadReferences()
  }, [])

  const downloadTemplate = () => {
    const wsData = [
      ["Nombre Completo", "Email", "Rol", "Zona", "Distribuidor", "Vendedor", "Tecnico"],
      ["Maria Gomez", "maria@ejemplo.com", "capitan", "Santander", "Agralba Santander", "Juan Vendedor", "Pedro Tecnico"],
      ["Carlos Ruiz", "carlos@ejemplo.com", "director_tecnico", "Antioquia", "Agralba Antioquia", "", ""],
      ["Ana Juez", "ana@ejemplo.com", "arbitro", "", "", "", ""],
      ["Luis Supervisor", "luis@ejemplo.com", "supervisor", "Norte", "Distribuidor XYZ", "", ""]
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Usuarios")
    XLSX.writeFile(wb, "plantilla_usuarios.xlsx")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileSelected(file)
    setResults([])

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet)

        const parsedData = jsonData.map((row) => ({
          Nombre: (row["Nombre Completo"] || row.Nombre)?.trim() || "",
          Email: row.Email?.trim() || "",
          Rol: row.Rol?.trim().toLowerCase() || "",
          Zona: row.Zona?.trim() || "",
          Distribuidor: row.Distribuidor?.trim() || "",
          Vendedor: row.Vendedor?.trim() || "",
          Tecnico: row.Tecnico?.trim() || "",
        }))

        const validData = parsedData.filter(u => u.Email && u.Nombre)

        if (validData.length === 0) {
          toast({
            title: "Archivo inválido",
            description: "No se encontraron usuarios válidos en el archivo. Verifica que las cabeceras sean: Nombre Completo, Email, Rol, Zona, Distribuidor, Vendedor, Tecnico.",
            variant: "destructive"
          })
          setUsersData([])
          setFileSelected(null)
          return
        }

        setUsersData(validData as UserImportData[])
        toast({
          title: "Archivo cargado",
          description: `Se encontraron ${validData.length} usuarios para procesar.`,
        })
      } catch (error: any) {
        toast({
          title: "Error al leer el archivo",
          description: error.message,
          variant: "destructive"
        })
      }
    }
    reader.readAsBinaryString(file)
  }

  // Find IDs based on names (case insensitive)
  // Nota: Esta función ya no se usa directamente en el loop para evitar staleness de React state,
  // pero la mantenemos por si se usa en otro lado.
  const resolveReference = (type: "zone" | "distributor" | "team", name: string, list: any[]) => {
    if (!name) return null
    const normalizedName = name.toLowerCase().trim()
    const found = list.find(item => item.name.toLowerCase().trim() === normalizedName)
    return found ? found.id : null
  }

  async function handleProcess() {
    if (usersData.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setResults([])

    const totalUsers = usersData.length
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    // Usar arrays locales para la resolución en el loop, para que las creaciones nuevas
    // estén disponibles inmediatamente en la siguiente iteración y evitar duplicados.
    const localZones = [...zones]
    const localDistributors = [...distributors]

    for (let i = 0; i < totalUsers; i++) {
      const user = usersData[i]
      setCurrentUser(user.Nombre)

      try {
        // Resolve foreign keys - AUTO CREAR si no existen
        let zoneId = resolveReference("zone", user.Zona, localZones)
        if (!zoneId && user.Zona) {
          const { data, error } = await supabase.from("zones").insert({ name: user.Zona }).select("id, name").single()
          if (!error && data) {
            zoneId = data.id
            localZones.push(data)
          }
        }

        let distributorId = resolveReference("distributor", user.Distribuidor, localDistributors)
        if (!distributorId && user.Distribuidor) {
          const { data, error } = await supabase.from("distributors").insert({ name: user.Distribuidor }).select("id, name").single()
          if (!error && data) {
            distributorId = data.id
            localDistributors.push(data)
          }
        }

        // Validate required fields based on role
        if (!user.Email || !user.Rol || !user.Nombre) {
          setResults((prev) => [...prev, { user, success: false, action: "error", error: "Email, Nombre y Rol son obligatorios" }])
          errors++
          setProgress(((i + 1) / totalUsers) * 100)
          continue
        }

        if (user.Rol === "vendedor" || user.Rol === "tecnico") {
          setResults((prev) => [...prev, { user, success: false, action: "error", error: `El rol '${user.Rol}' ya no es un usuario del sistema (ahora son campos del Capitán)` }])
          errors++
          setProgress(((i + 1) / totalUsers) * 100)
          continue
        }

        // Verify if user exists
        const { data: existingUser, error: findError } = await findUserByEmail(user.Email)

        if (findError) {
          setResults((prev) => [
            ...prev,
            { user, success: false, action: "error", error: `Error al buscar usuario: ${findError}` },
          ])
          errors++
        } else if (existingUser) {
          // El usuario existe, actualizar si está en modo "update" o "both"
          if (mode === "create") {
            setResults((prev) => [
              ...prev,
              { user, success: true, action: "skipped", error: "Usuario ya existe y modo es solo creación" },
            ])
            skipped++
          } else {
            // Verificar si necesita actualización
            const needsZoneUpdate = !existingUser.zone_id && zoneId
            const needsDistributorUpdate = !existingUser.distributor_id && distributorId
            const needsUpdate = !updateOnlyMissing || needsZoneUpdate || needsDistributorUpdate

            if (needsUpdate) {
              const result = await updateUserProfile(existingUser.id, {
                fullName: user.Nombre,
                role: user.Rol,
                zoneId: zoneId || existingUser.zone_id,
                distributorId: distributorId || existingUser.distributor_id,
                vendedorName: user.Vendedor,
                tecnicoName: user.Tecnico,
              })

              if (result.error) {
                setResults((prev) => [...prev, { user, success: false, action: "error", error: result.error }])
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
            const formData = new FormData()
            formData.append("email", user.Email)
            formData.append("password", "Corteva2026*")
            formData.append("full_name", user.Nombre)
            formData.append("role", user.Rol)
            if (zoneId) formData.append("zone_id", zoneId)
            if (distributorId) formData.append("distributor_id", distributorId)
            if (user.Rol === "capitan") {
              if (user.Vendedor) formData.append("vendedor_name", user.Vendedor)
              if (user.Tecnico) formData.append("tecnico_name", user.Tecnico)
            }

            const result = await createUser(Object.fromEntries(formData))

            if (result.error) {
              setResults((prev) => [...prev, { user, success: false, action: "error", error: result.error }])
              errors++
            } else {
              setResults((prev) => [...prev, { user, success: true, action: "created" }])
              created++
            }
          }
        }
      } catch (error: any) {
        setResults((prev) => [...prev, { user, success: false, action: "error", error: error.message }])
        errors++
      }

      setProgress(((i + 1) / totalUsers) * 100)

      // Pausa más larga para evitar Rate Limits (Max 30 requests / second en auth admin, 
      // pero es mejor ir lento para no colapsar Supabase free tier o edge functions limit)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    // Actualizar estado global si creamos nuevas zonas o distribuidores
    setZones(localZones)
    setDistributors(localDistributors)

    setIsProcessing(false)
    setCurrentUser("")
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFileSelected(null)

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Importación Masiva de Usuarios</CardTitle>
              <CardDescription className="space-y-4 pt-2">
                <p>
                  Sube un archivo Excel (.xlsx) o CSV para crear nuevos usuarios o actualizar los existentes con sus zonas, distribuidores y equipos.
                </p>
                <div className="bg-muted p-4 rounded-md text-sm text-left">
                  <h4 className="font-bold mb-2 text-foreground">Instrucciones importantes:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>La columna <strong>Nombre Completo</strong> debe llevar nombres y apellidos en la misma celda (no separados).</li>
                    <li>Los <strong>Roles exactos</strong> permitidos en la columna "Rol" son: <code className="bg-background px-1 py-0.5 rounded text-foreground">capitan</code>, <code className="bg-background px-1 py-0.5 rounded text-foreground">director_tecnico</code>, <code className="bg-background px-1 py-0.5 rounded text-foreground">arbitro</code>, <code className="bg-background px-1 py-0.5 rounded text-foreground">supervisor</code>, <code className="bg-background px-1 py-0.5 rounded text-foreground">admin</code>.</li>
                    <li><strong>Vendedor y Técnico NO son roles:</strong> Son nombres de personas asociadas al <strong>capitan</strong>. Llena esas dos columnas ÚNICAMENTE cuando el Rol del usuario sea <code className="bg-background px-1 py-0.5 rounded text-foreground">capitan</code>.</li>
                    <li>Las columnas <strong>Zona</strong> y <strong>Distribuidor</strong> deben tener el nombre exacto de la zona y distribuidor que ya fueron creados previamente en el sistema.</li>
                  </ul>
                </div>
              </CardDescription>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Plantilla CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isProcessing && (
            <div className="space-y-6">
              
              <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  {fileSelected ? fileSelected.name : "Subir archivo CSV"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {fileSelected ? `Seleccionado (${usersData.length} usuarios encontrados)` : "Sube el archivo completado a partir de la plantilla"}
                </p>
                <div className="flex gap-2">
                  <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="excel-upload"
                  />
                  <Label htmlFor="excel-upload" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2">
                      Seleccionar Archivo
                    </div>
                  </Label>
                  {fileSelected && (
                    <Button variant="outline" onClick={() => {
                      setFileSelected(null)
                      setUsersData([])
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {usersData.length > 0 && (
                <>
                  <Tabs defaultValue="both" className="w-full" onValueChange={(v) => setMode(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="both">Crear y Actualizar</TabsTrigger>
                      <TabsTrigger value="create">Solo Crear Nuevos</TabsTrigger>
                      <TabsTrigger value="update">Solo Actualizar Existentes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="both" className="p-4 border rounded-md mt-2">
                      <p className="text-sm text-muted-foreground">
                        Este modo creará usuarios nuevos y actualizará los existentes con la información correcta.
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
                      <Label htmlFor="update-missing">Solo actualizar usuarios que les falte información</Label>
                    </div>
                  )}

                  <Button onClick={handleProcess} className="w-full" size="lg" disabled={usersData.length === 0}>
                    <Upload className="mr-2 h-4 w-4" />
                    Iniciar Proceso ({usersData.length} usuarios)
                  </Button>
                </>
              )}
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
            <div className="space-y-4 mt-8">
              <h3 className="font-medium">Resultados del último proceso:</h3>
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
                        <div className="font-medium">{result.user.Nombre}</div>
                        <div className="text-sm text-muted-foreground">{result.user.Email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {result.user.Rol}
                      </div>
                      <div className="text-xs">
                        {result.action === "created" && "Creado"}
                        {result.action === "updated" && "Actualizado"}
                        {result.action === "skipped" && "Omitido"}
                        {result.action === "error" && "Error"}
                      </div>
                      {result.error && <div className="text-xs text-red-500">{result.error}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg justify-between">
                <span className="font-medium">Resumen:</span>
                <div className="flex gap-4 text-sm font-medium">
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
