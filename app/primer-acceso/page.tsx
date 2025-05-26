"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Upload, CheckCircle, AlertCircle, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function PrimerAccesoPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [teamName, setTeamName] = useState("")
  const [zone, setZone] = useState("norte")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState("password")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  // Evaluar la fortaleza de la contraseña
  const evaluatePasswordStrength = (password: string) => {
    let strength = 0

    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)

    return strength >= 75
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setPasswordError("")

    // Validar contraseña actual
    if (!currentPassword) {
      setPasswordError("Debes ingresar tu contraseña temporal")
      setIsSubmitting(false)
      return
    }

    // Validar que la nueva contraseña sea fuerte
    if (!evaluatePasswordStrength(newPassword)) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial",
      )
      setIsSubmitting(false)
      return
    }

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      setIsSubmitting(false)
      return
    }

    // Simular cambio de contraseña (con un pequeño retraso para mostrar el estado de carga)
    setTimeout(() => {
      setIsSubmitting(false)
      setCurrentStep("team")
    }, 1000)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.")
        return
      }

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen.")
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogoPreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleTeamSetup = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validar nombre del equipo
    if (!teamName.trim()) {
      alert("Por favor ingresa un nombre para tu equipo")
      setIsSubmitting(false)
      return
    }

    // Simular envío de datos (con un pequeño retraso para mostrar el estado de carga)
    setTimeout(() => {
      setIsSubmitting(false)
      setSetupComplete(true)

      // Redirigir después de mostrar mensaje de éxito
      setTimeout(() => {
        router.push("/representante/dashboard")
      }, 2000)
    }, 1500)
  }

  // Si la configuración está completa, mostrar mensaje de éxito
  if (setupComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-corteva-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/corteva-logo.png" alt="Logo de Corteva" className="h-12" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-corteva-700">
              ¡Configuración Completada!
            </CardTitle>
            <CardDescription className="text-center">
              Tu cuenta ha sido configurada exitosamente. Serás redirigido al dashboard en unos segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-corteva-600 mb-4" />
            <Progress value={100} className="w-full h-2 mb-2" />
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-corteva-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/corteva-logo.png" alt="Logo de Corteva" className="h-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-corteva-700">Primer Acceso</CardTitle>
          <CardDescription className="text-center">Configura tu cuenta para comenzar a participar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" disabled={isSubmitting}>
                Cambiar Contraseña
              </TabsTrigger>
              <TabsTrigger value="team" disabled={currentStep !== "team" || isSubmitting}>
                Configurar Equipo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Temporal</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ingresa la contraseña temporal que recibiste por correo electrónico
                  </p>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        evaluatePasswordStrength(e.target.value)
                      }}
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isSubmitting}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Fortaleza de la contraseña</span>
                      <span className="text-xs font-medium">
                        {passwordStrength < 25 && "Muy débil"}
                        {passwordStrength >= 25 && passwordStrength < 50 && "Débil"}
                        {passwordStrength >= 50 && passwordStrength < 75 && "Moderada"}
                        {passwordStrength >= 75 && "Fuerte"}
                      </span>
                    </div>
                    <Progress
                      value={passwordStrength}
                      className="h-1.5"
                      indicatorClassName={
                        passwordStrength < 25
                          ? "bg-red-500"
                          : passwordStrength < 50
                            ? "bg-orange-500"
                            : passwordStrength < 75
                              ? "bg-yellow-500"
                              : "bg-corteva-500"
                      }
                    />
                  </div>

                  <ul className="text-xs space-y-1 mt-2">
                    <li
                      className={`flex items-center gap-1 ${newPassword.length >= 8 ? "text-corteva-600" : "text-muted-foreground"}`}
                    >
                      {newPassword.length >= 8 ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      Al menos 8 caracteres
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? "text-corteva-600" : "text-muted-foreground"}`}
                    >
                      {/[A-Z]/.test(newPassword) ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      Al menos una letra mayúscula
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? "text-corteva-600" : "text-muted-foreground"}`}
                    >
                      {/[0-9]/.test(newPassword) ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      Al menos un número
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-corteva-600" : "text-muted-foreground"}`}
                    >
                      {/[^A-Za-z0-9]/.test(newPassword) ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      Al menos un carácter especial
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-corteva-600 hover:bg-corteva-700" disabled={isSubmitting}>
                  {isSubmitting ? "Procesando..." : "Continuar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="team">
              <form onSubmit={handleTeamSetup} className="space-y-4 mt-4">
                <Alert className="bg-corteva-50 border-corteva-200">
                  <CheckCircle className="h-4 w-4 text-corteva-600" />
                  <AlertTitle className="text-corteva-800">Contraseña actualizada</AlertTitle>
                  <AlertDescription className="text-corteva-700">
                    Tu contraseña ha sido actualizada correctamente. Ahora configura tu equipo.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="team-name">Nombre del Equipo</Label>
                  <Input
                    id="team-name"
                    placeholder="Ingrese el nombre de su equipo"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Elige un nombre creativo y representativo para tu equipo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-logo">Logo del Equipo (Opcional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 h-40 bg-gray-50">
                      {logoPreview ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveLogo}
                            disabled={isSubmitting}
                          >
                            <span className="sr-only">Eliminar logo</span>
                            &times;
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Camera className="h-10 w-10 mb-2 text-gray-400" />
                          <span className="text-sm text-center">Sin logo</span>
                          <span className="text-xs text-center mt-1">Formato JPG, PNG o SVG</span>
                          <span className="text-xs text-center">Máximo 5MB</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <Input
                        id="team-logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("team-logo")?.click()}
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {logoFile ? "Cambiar logo" : "Seleccionar archivo"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        El logo aparecerá en el ranking y en tu perfil
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Zona (Predefinida por Admin)</Label>
                  <Select value={zone} onValueChange={setZone} disabled>
                    <SelectTrigger id="zone" className="bg-gray-50">
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="norte">Zona Norte</SelectItem>
                      <SelectItem value="sur">Zona Sur</SelectItem>
                      <SelectItem value="este">Zona Este</SelectItem>
                      <SelectItem value="oeste">Zona Oeste</SelectItem>
                      <SelectItem value="central">Zona Central</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta zona ha sido asignada por el administrador y no puede ser modificada.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-corteva-600 hover:bg-corteva-700 mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Procesando..." : "Finalizar Configuración"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Si tienes problemas para configurar tu cuenta, contacta al administrador del sistema.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
