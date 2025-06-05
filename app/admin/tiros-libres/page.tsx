"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Trash2, Target, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  createFreeKickGoal,
  deleteFreeKickGoal,
  getFreeKickGoals,
  type FreeKickGoal,
} from "@/app/actions/free-kick-goals"
import { getTeams } from "@/app/actions/teams"

const formSchema = z.object({
  teamId: z.string().min(1, { message: "Selecciona un equipo" }),
  points: z.coerce
    .number()
    .min(1, { message: "Debe ser al menos 1 punto" })
    .max(1000, { message: "Máximo 1000 puntos" }),
  reason: z
    .string()
    .min(3, { message: "Proporciona una razón (mínimo 3 caracteres)" })
    .max(500, { message: "Máximo 500 caracteres" }),
})

export default function TirosLibresPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [freeKickGoals, setFreeKickGoals] = useState<FreeKickGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamId: "",
      points: 100,
      reason: "",
    },
  })

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [teamsResponse, goalsResponse] = await Promise.all([getTeams(), getFreeKickGoals()])

        if (teamsResponse.data) {
          setTeams(teamsResponse.data)
        }

        if (goalsResponse.data) {
          setFreeKickGoals(goalsResponse.data)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Intenta de nuevo.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await createFreeKickGoal(values.teamId, values.points, values.reason)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Actualizar la lista de tiros libres
      const { data } = await getFreeKickGoals()
      if (data) {
        setFreeKickGoals(data)
      }

      // Resetear el formulario
      form.reset({
        teamId: "",
        points: 100,
        reason: "",
      })

      toast({
        title: "Éxito",
        description: "Tiro libre registrado correctamente",
      })
    } catch (error) {
      console.error("Error al crear tiro libre:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el tiro libre. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(id)
    try {
      const result = await deleteFreeKickGoal(id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Actualizar la lista de tiros libres
      setFreeKickGoals(freeKickGoals.filter((goal) => goal.id !== id))

      toast({
        title: "Éxito",
        description: "Tiro libre eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar tiro libre:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el tiro libre. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Agrupar por equipo para mostrar totales
  const teamTotals = freeKickGoals.reduce(
    (acc, goal) => {
      if (!acc[goal.team_id]) {
        acc[goal.team_id] = {
          team_name: goal.team_name,
          zone_name: goal.zone_name,
          total_points: 0,
        }
      }
      acc[goal.team_id].total_points += goal.points
      return acc
    },
    {} as Record<string, { team_name: string; zone_name: string; total_points: number }>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tiros Libres</h1>
        <p className="text-muted-foreground">
          Adjudica puntos adicionales a equipos por tiros libres o bonificaciones especiales.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Tiro Libre</CardTitle>
            <CardDescription>Los puntos se sumarán automáticamente al total del equipo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un equipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} - {team.zone?.name || "Sin zona"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntos</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>Cada 100 puntos equivalen a 1 gol.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explica por qué se otorgan estos puntos"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Registrando..." : "Registrar Tiro Libre"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen por Equipo</CardTitle>
            <CardDescription>Total de puntos por tiros libres adjudicados a cada equipo.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(teamTotals).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(teamTotals).map(([teamId, data]) => (
                  <div key={teamId} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{data.team_name}</p>
                      <p className="text-sm text-muted-foreground">{data.zone_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {data.total_points} puntos
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        {Math.floor(data.total_points / 100)} goles
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Award className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No hay tiros libres registrados aún.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Historial de Tiros Libres</h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Cargando tiros libres...</p>
          </div>
        ) : freeKickGoals.length > 0 ? (
          <div className="space-y-4">
            {freeKickGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{goal.team_name}</CardTitle>
                      <CardDescription>{goal.zone_name}</CardDescription>
                    </div>
                    <Badge className="ml-auto">{goal.points} puntos</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm">{goal.reason}</p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(goal.created_at), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(goal.id)}
                    disabled={isDeleting === goal.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {isDeleting === goal.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertTitle>No hay tiros libres</AlertTitle>
            <AlertDescription>
              No se han registrado tiros libres aún. Utiliza el formulario para adjudicar puntos a los equipos.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
