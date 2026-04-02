"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Save, Trophy, Zap, Upload } from "lucide-react"
import { getSystemConfig, updateSystemConfig } from "@/app/actions/system-config"
import { useToast } from "@/components/ui/use-toast"
import { ContestResetSection } from "@/components/admin/contest-reset-section"
import { BulkPasswordResetSection } from "@/components/admin/bulk-password-reset-section"

export default function ConfiguracionPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() + 3)))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [puntosParaGol, setPuntosParaGol] = useState<number>(100)

  // Estados para desafíos
  const [metaGolesSemanales, setMetaGolesSemanales] = useState<number>(40)
  const [metaVentasSemanales, setMetaVentasSemanales] = useState<number>(5)
  const [penaltisMetaGoles, setPenaltisMetaGoles] = useState<number>(1)
  const [penaltisMetaVentas, setPenaltisMetaVentas] = useState<number>(1)

  // Estados para notificaciones
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true)
  const [pushNotifications, setPushNotifications] = useState<boolean>(true)
  const [inAppNotifications, setInAppNotifications] = useState<boolean>(true)
  const [notifyNewSale, setNotifyNewSale] = useState<boolean>(true)
  const [notifyNewClient, setNotifyNewClient] = useState<boolean>(true)
  const [notifyRankingChange, setNotifyRankingChange] = useState<boolean>(true)
  const [notifyAchievement, setNotifyAchievement] = useState<boolean>(true)
  const [notifyLevelUp, setNotifyLevelUp] = useState<boolean>(true)
  const [notifyNewChallenge, setNotifyNewChallenge] = useState<boolean>(true)
  const [notifyPenaltiEarned, setNotifyPenaltiEarned] = useState<boolean>(true)
  const [notifyPenaltiUsed, setNotifyPenaltiUsed] = useState<boolean>(true)

  // Estados para plantillas de correo
  const [emailWelcome, setEmailWelcome] = useState<string>(
    "¡Bienvenido a Super Ganadería Concurso! Tu cuenta ha sido creada correctamente.",
  )
  const [emailPasswordReset, setEmailPasswordReset] = useState<string>("Has solicitado restablecer tu contraseña.")
  const [emailNotification, setEmailNotification] = useState<string>("Tienes una nueva notificación en la plataforma.")

  // Estados para marca
  const [siteName, setSiteName] = useState<string>("Corteva - Super Ganadería Concurso")
  const [siteDescription, setSiteDescription] = useState<string>("Plataforma de concurso de ventas para Corteva")
  const [adminEmail, setAdminEmail] = useState<string>("admin@corteva.com")
  const [supportEmail, setSupportEmail] = useState<string>("soporte@corteva.com")

  // Estados para apariencia
  const [primaryColor, setPrimaryColor] = useState<string>("#0072ce")
  const [secondaryColor, setSecondaryColor] = useState<string>("#f59e0b")
  const [accentColor, setAccentColor] = useState<string>("#3b82f6")
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff")
  const [textColor, setTextColor] = useState<string>("#333333")
  const [useCustomColors, setUseCustomColors] = useState<boolean>(false)
  const [enableDarkMode, setEnableDarkMode] = useState<boolean>(true)
  const [enableSystemTheme, setEnableSystemTheme] = useState<boolean>(true)

  const { toast } = useToast()
  const [configTab, setConfigTab] = useState("general")

  useEffect(() => {
    loadAllConfig()
  }, [])

  async function loadAllConfig() {
    try {
      // Cargar configuración de puntos para gol
      const puntosConfig = await getSystemConfig("puntos_para_gol")
      if (puntosConfig.success && puntosConfig.data) {
        setPuntosParaGol(Number(puntosConfig.data))
      }

      // Cargar configuración de desafíos
      const desafiosConfig = await getSystemConfig("desafios_config")
      if (desafiosConfig.success && desafiosConfig.data) {
        const config = desafiosConfig.data
        setMetaGolesSemanales(config.meta_goles_semanales || 40)
        setMetaVentasSemanales(config.meta_ventas_semanales || 5)
        setPenaltisMetaGoles(config.penaltis_meta_goles || 1)
        setPenaltisMetaVentas(config.penaltis_meta_ventas || 1)
      }

      // Cargar configuración de notificaciones
      const notificationsConfig = await getSystemConfig("notifications_config")
      if (notificationsConfig.success && notificationsConfig.data) {
        const config = notificationsConfig.data
        setEmailNotifications(config.email_notifications !== false)
        setPushNotifications(config.push_notifications !== false)
        setInAppNotifications(config.in_app_notifications !== false)
        setNotifyNewSale(config.notify_new_sale !== false)
        setNotifyNewClient(config.notify_new_client !== false)
        setNotifyRankingChange(config.notify_ranking_change !== false)
        setNotifyAchievement(config.notify_achievement !== false)
        setNotifyLevelUp(config.notify_level_up !== false)
        setNotifyNewChallenge(config.notify_new_challenge !== false)
        setNotifyPenaltiEarned(config.notify_penalti_earned !== false)
        setNotifyPenaltiUsed(config.notify_penalti_used !== false)
      }

      // Cargar plantillas de correo
      const emailTemplatesConfig = await getSystemConfig("email_templates")
      if (emailTemplatesConfig.success && emailTemplatesConfig.data) {
        const config = emailTemplatesConfig.data
        setEmailWelcome(config.welcome || "¡Bienvenido a Super Ganadería Concurso!")
        setEmailPasswordReset(config.password_reset || "Has solicitado restablecer tu contraseña.")
        setEmailNotification(config.notification || "Tienes una nueva notificación en la plataforma.")
      }

      // Cargar configuración general
      const generalConfig = await getSystemConfig("general_config")
      if (generalConfig.success && generalConfig.data) {
        const config = generalConfig.data
        setSiteName(config.site_name || "Corteva - Super Ganadería Concurso")
        setSiteDescription(config.site_description || "Plataforma de concurso de ventas para Corteva")
        setAdminEmail(config.admin_email || "admin@corteva.com")
        setSupportEmail(config.support_email || "soporte@corteva.com")
      }

      // Cargar configuración de apariencia
      const appearanceConfig = await getSystemConfig("appearance_config")
      if (appearanceConfig.success && appearanceConfig.data) {
        const config = appearanceConfig.data
        setPrimaryColor(config.primary_color || "#0072ce")
        setSecondaryColor(config.secondary_color || "#f59e0b")
        setAccentColor(config.accent_color || "#3b82f6")
        setBackgroundColor(config.background_color || "#ffffff")
        setTextColor(config.text_color || "#333333")
        setUseCustomColors(config.use_custom_colors || false)
        setEnableDarkMode(config.enable_dark_mode !== false)
        setEnableSystemTheme(config.enable_system_theme !== false)
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Guardar configuración de puntos para gol
      await updateSystemConfig("puntos_para_gol", puntosParaGol)

      // Guardar configuración de desafíos
      const desafiosConfig = {
        meta_goles_semanales: metaGolesSemanales,
        meta_ventas_semanales: metaVentasSemanales,
        penaltis_meta_goles: penaltisMetaGoles,
        penaltis_meta_ventas: penaltisMetaVentas,
      }
      await updateSystemConfig("desafios_config", desafiosConfig)

      // Guardar configuración de notificaciones
      const notificationsConfig = {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        in_app_notifications: inAppNotifications,
        notify_new_sale: notifyNewSale,
        notify_new_client: notifyNewClient,
        notify_ranking_change: notifyRankingChange,
        notify_achievement: notifyAchievement,
        notify_level_up: notifyLevelUp,
        notify_new_challenge: notifyNewChallenge,
        notify_penalti_earned: notifyPenaltiEarned,
        notify_penalti_used: notifyPenaltiUsed,
      }
      await updateSystemConfig("notifications_config", notificationsConfig)

      // Guardar plantillas de correo
      const emailTemplatesConfig = {
        welcome: emailWelcome,
        password_reset: emailPasswordReset,
        notification: emailNotification,
      }
      await updateSystemConfig("email_templates", emailTemplatesConfig)

      // Guardar configuración general
      const generalConfig = {
        site_name: siteName,
        site_description: siteDescription,
        admin_email: adminEmail,
        support_email: supportEmail,
      }
      await updateSystemConfig("general_config", generalConfig)

      // Guardar configuración de apariencia
      const appearanceConfig = {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        background_color: backgroundColor,
        text_color: textColor,
        use_custom_colors: useCustomColors,
        enable_dark_mode: enableDarkMode,
        enable_system_theme: enableSystemTheme,
      }
      await updateSystemConfig("appearance_config", appearanceConfig)

      toast({
        title: "Configuración guardada",
        description: "Todos los cambios han sido guardados correctamente.",
      })
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la configuración.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h2>
          <p className="text-muted-foreground">Administra la configuración general del concurso</p>
        </div>
      </div>

      <Tabs value={configTab} onValueChange={setConfigTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="concurso">Concurso</TabsTrigger>
          <TabsTrigger value="penaltis">Penaltis</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="marca">Marca</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="usuarios-pwd">Usuarios / contraseñas</TabsTrigger>
          <TabsTrigger value="reseteo" className="text-destructive data-[state=active]:text-destructive">
            Reseteo
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Configura la información básica del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descripción</Label>
                  <Textarea
                    id="siteDescription"
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email de Administración</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email de Soporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Acceso</CardTitle>
                <CardDescription>Configura las opciones de acceso al sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowRegistration">Permitir Registro Público</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar el registro público de usuarios en el sistema
                    </p>
                  </div>
                  <Switch id="allowRegistration" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireEmailVerification">Requerir Verificación de Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Solicitar verificación de email para nuevos usuarios
                    </p>
                  </div>
                  <Switch id="requireEmailVerification" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableMaintenance">Modo Mantenimiento</Label>
                    <p className="text-sm text-muted-foreground">
                      Activar modo de mantenimiento (solo administradores podrán acceder)
                    </p>
                  </div>
                  <Switch id="enableMaintenance" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="concurso" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Concurso</CardTitle>
                <CardDescription>Configura los parámetros del concurso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Finalización</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concursoNombre">Nombre del Concurso</Label>
                  <Input id="concursoNombre" defaultValue="Super Ganadería" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concursoDescripcion">Descripción del Concurso</Label>
                  <Textarea
                    id="concursoDescripcion"
                    defaultValue="Concurso de ventas para capitanes de Corteva"
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="puntosParaGol">Puntos necesarios para un Gol</Label>
                  <Input
                    id="puntosParaGol"
                    type="number"
                    value={puntosParaGol}
                    onChange={(e) => setPuntosParaGol(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de puntos que se deben acumular para anotar un gol
                  </p>
                </div>

                <Separator />

                <div className="rounded-md border border-muted bg-muted/30 p-4 space-y-1">
                  <p className="text-sm font-medium">Tiros libres (fijo)</p>
                  <p className="text-xs text-muted-foreground">
                    Los goles del concurso usan solo ventas y clientes competencia. Los tiros libres tienen su propia
                    clasificación y no suman a puntos ni goles del concurso.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="penaltis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Penaltis</CardTitle>
                <CardDescription>Configura el sistema de penaltis para multiplicar goles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="penaltisEnabled">Activar Sistema de Penaltis</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="penaltisEnabled" defaultChecked />
                    <Label htmlFor="penaltisEnabled">Habilitar el sistema de penaltis para todos los equipos</Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="metaGolesSemanales">Meta de Goles Semanal</Label>
                  <Input
                    id="metaGolesSemanales"
                    type="number"
                    value={metaGolesSemanales}
                    onChange={(e) => setMetaGolesSemanales(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de goles que cada equipo debe alcanzar semanalmente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaVentasSemanales">Meta de Ventas para Desafío</Label>
                  <Input
                    id="metaVentasSemanales"
                    type="number"
                    value={metaVentasSemanales}
                    onChange={(e) => setMetaVentasSemanales(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de ventas que cada capitán debe registrar semanalmente para el desafío
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltisMetaGoles">Penaltis por Completar Meta de Goles</Label>
                  <Input
                    id="penaltisMetaGoles"
                    type="number"
                    value={penaltisMetaGoles}
                    onChange={(e) => setPenaltisMetaGoles(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de penaltis otorgados por completar la meta semanal de goles
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltisMetaVentas">Penaltis por Completar Desafío de Ventas</Label>
                  <Input
                    id="penaltisMetaVentas"
                    type="number"
                    value={penaltisMetaVentas}
                    onChange={(e) => setPenaltisMetaVentas(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de penaltis otorgados por completar el desafío semanal de ventas
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="penaltisBonus">Bono de Penalti (%)</Label>
                  <Input id="penaltisBonus" type="number" defaultValue="25" />
                  <p className="text-xs text-muted-foreground">
                    Porcentaje de goles adicionales que otorga cada penalti (25% = 0.25 x goles actuales)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltisMaxStock">Máximo de Penaltis Acumulables</Label>
                  <Input id="penaltisMaxStock" type="number" defaultValue="5" />
                  <p className="text-xs text-muted-foreground">
                    Número máximo de penaltis que un equipo puede acumular
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Plantillas de Desafíos</Label>
                  <div className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <div className="font-medium">Desafío de Ventas Semanal</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Registra {metaVentasSemanales} ventas más esta semana y gana {penaltisMetaVentas} penalti
                      {penaltisMetaVentas > 1 ? "s" : ""}.
                    </p>
                  </div>

                  <div className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <div className="font-medium">Meta de Goles Semanal</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Completa el 100% de tu meta de {metaGolesSemanales} goles para ganar {penaltisMetaGoles} penalti
                      {penaltisMetaGoles > 1 ? "s" : ""}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>Configura las notificaciones del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableEmailNotifications">Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Enviar notificaciones por correo electrónico</p>
                  </div>
                  <Switch
                    id="enableEmailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enablePushNotifications">Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">Enviar notificaciones push en el navegador</p>
                  </div>
                  <Switch
                    id="enablePushNotifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableInAppNotifications">Notificaciones en la Aplicación</Label>
                    <p className="text-sm text-muted-foreground">Mostrar notificaciones dentro de la aplicación</p>
                  </div>
                  <Switch
                    id="enableInAppNotifications"
                    checked={inAppNotifications}
                    onCheckedChange={setInAppNotifications}
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <Label>Eventos que generan notificaciones</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="notifyNewSale" checked={notifyNewSale} onCheckedChange={setNotifyNewSale} />
                      <Label htmlFor="notifyNewSale">Nueva venta registrada</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="notifyNewClient" checked={notifyNewClient} onCheckedChange={setNotifyNewClient} />
                      <Label htmlFor="notifyNewClient">Nuevo cliente captado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifyRankingChange"
                        checked={notifyRankingChange}
                        onCheckedChange={setNotifyRankingChange}
                      />
                      <Label htmlFor="notifyRankingChange">Cambio en el ranking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifyAchievement"
                        checked={notifyAchievement}
                        onCheckedChange={setNotifyAchievement}
                      />
                      <Label htmlFor="notifyAchievement">Logro desbloqueado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="notifyLevelUp" checked={notifyLevelUp} onCheckedChange={setNotifyLevelUp} />
                      <Label htmlFor="notifyLevelUp">Subida de nivel</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifyNewChallenge"
                        checked={notifyNewChallenge}
                        onCheckedChange={setNotifyNewChallenge}
                      />
                      <Label htmlFor="notifyNewChallenge">Nuevo desafío disponible</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifyPenaltiEarned"
                        checked={notifyPenaltiEarned}
                        onCheckedChange={setNotifyPenaltiEarned}
                      />
                      <Label htmlFor="notifyPenaltiEarned">Penalti ganado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifyPenaltiUsed"
                        checked={notifyPenaltiUsed}
                        onCheckedChange={setNotifyPenaltiUsed}
                      />
                      <Label htmlFor="notifyPenaltiUsed">Penalti reclamado</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plantillas de Correo</CardTitle>
                <CardDescription>Configura las plantillas de correo electrónico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailWelcome">Correo de Bienvenida</Label>
                  <Textarea
                    id="emailWelcome"
                    value={emailWelcome}
                    onChange={(e) => setEmailWelcome(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPasswordReset">Restablecimiento de Contraseña</Label>
                  <Textarea
                    id="emailPasswordReset"
                    value={emailPasswordReset}
                    onChange={(e) => setEmailPasswordReset(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailNotification">Notificación General</Label>
                  <Textarea
                    id="emailNotification"
                    value={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marca" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logos Institucionales</CardTitle>
                <CardDescription>Gestiona los logos institucionales del concurso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Principal</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-40 overflow-hidden rounded-md border bg-white p-2">
                      <img src="/corteva-logo.png" alt="Logo principal" className="h-full w-full object-contain" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Cambiar Logo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este logo aparecerá en el encabezado y en la página de inicio de sesión.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Logo para Ranking Público</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-40 overflow-hidden rounded-md border bg-white p-2">
                      <img src="/corteva-logo.png" alt="Logo ranking" className="h-full w-full object-contain" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Cambiar Logo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Este logo aparecerá en la página de ranking público.</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Logo para Correos Electrónicos</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-40 overflow-hidden rounded-md border bg-white p-2">
                      <img src="/corteva-logo.png" alt="Logo emails" className="h-full w-full object-contain" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Cambiar Logo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este logo aparecerá en los correos electrónicos enviados por el sistema.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Colores de Marca</CardTitle>
                <CardDescription>Configura los colores de la marca para personalizar la plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColorBrand">Color Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColorBrand"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este color se utilizará para botones, enlaces y elementos destacados.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColorBrand">Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColorBrand"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este color se utilizará para acentos y elementos secundarios.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColorBrand">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColorBrand"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este color se utilizará como fondo principal de la aplicación.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColorBrand">Color de Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColorBrand"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">Este color se utilizará para el texto principal.</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useCustomColorsBrand">Usar Colores Personalizados</Label>
                    <p className="text-sm text-muted-foreground">
                      Activar para aplicar los colores personalizados en toda la plataforma
                    </p>
                  </div>
                  <Switch id="useCustomColorsBrand" checked={useCustomColors} onCheckedChange={setUseCustomColors} />
                </div>

                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    Vista Previa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apariencia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalización de la Interfaz</CardTitle>
                <CardDescription>Configura la apariencia del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColorApp">Color Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColorApp"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColorApp">Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColorApp"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColorApp">Color de Acento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColorApp"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 p-1"
                    />
                    <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo del Sistema</Label>
                  <div className="flex items-center gap-4">
                    <img src="/corteva-logo.png" alt="Logo actual" className="h-12" />
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Cambiar Logo
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded border bg-white p-1">
                      <img src="/corteva-logo.png" alt="Favicon actual" className="h-full w-full" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Cambiar Favicon
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableDarkModeApp">Modo Oscuro</Label>
                    <p className="text-sm text-muted-foreground">Habilitar opción de modo oscuro para los usuarios</p>
                  </div>
                  <Switch id="enableDarkModeApp" checked={enableDarkMode} onCheckedChange={setEnableDarkMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableSystemThemeApp">Seguir Tema del Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Adaptar el tema al modo claro/oscuro del sistema operativo
                    </p>
                  </div>
                  <Switch
                    id="enableSystemThemeApp"
                    checked={enableSystemTheme}
                    onCheckedChange={setEnableSystemTheme}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {configTab !== "reseteo" && configTab !== "usuarios-pwd" && (
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          )}
        </form>

        <TabsContent value="usuarios-pwd" className="space-y-4">
          <BulkPasswordResetSection />
        </TabsContent>

        <TabsContent value="reseteo" className="space-y-4">
          <ContestResetSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
