"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Star, Award, Bell, ArrowUp, ArrowDown, Activity, User, Package } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Sample feed data
// const initialFeed = [
//   {
//     id: 1,
//     type: "goal",
//     team: "Los Campeones",
//     points: 5,
//     product: "Producto A",
//     time: "Hace 2 minutos",
//     avatar: "/letter-c-typography.png",
//   },
//   {
//     id: 2,
//     type: "client",
//     team: "Equipo Estrella",
//     client: "Finca Los Olivos",
//     points: 10,
//     time: "Hace 15 minutos",
//     avatar: "/letter-e-abstract.png",
//   },
//   {
//     id: 3,
//     type: "achievement",
//     team: "Los Guerreros",
//     achievement: "¡5 ventas consecutivas!",
//     points: 15,
//     time: "Hace 32 minutos",
//     avatar: "/letter-g-floral.png",
//   },
//   {
//     id: 4,
//     type: "ranking",
//     team: "Equipo Fuerte",
//     change: "up",
//     position: 3,
//     time: "Hace 45 minutos",
//     avatar: "/letter-f-typography.png",
//   },
//   {
//     id: 5,
//     type: "goal",
//     team: "Los Tigres",
//     points: 8,
//     product: "Producto C",
//     time: "Hace 1 hora",
//     avatar: "/letter-t-typography.png",
//   },
// ]

export function LiveFeed() {
  // Datos de ejemplo para el feed en vivo
  const feedItems = [
    {
      id: 1,
      type: "sale",
      message: "Equipo Toros registró una venta de 50 unidades",
      time: "hace 5 minutos",
      icon: Package,
    },
    {
      id: 2,
      type: "ranking",
      message: "Equipo Águilas subió al 2do lugar en el ranking",
      time: "hace 15 minutos",
      icon: Trophy,
    },
    {
      id: 3,
      type: "client",
      message: "Equipo Leones registró un nuevo cliente",
      time: "hace 30 minutos",
      icon: User,
    },
    {
      id: 4,
      type: "achievement",
      message: "Equipo Tigres desbloqueó el logro 'Maestro de Ventas'",
      time: "hace 1 hora",
      icon: Activity,
    },
  ]
  const [feed, setFeed] = useState(feedItems)
  const [expanded, setExpanded] = useState(false)
  const [newNotification, setNewNotification] = useState(false)

  // Simulate receiving new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const randomTeams = ["Los Campeones", "Equipo Estrella", "Los Guerreros", "Equipo Fuerte", "Los Tigres"]
      const randomProducts = ["Producto A", "Producto B", "Producto C", "Producto D"]
      const randomClients = ["Finca El Amanecer", "Finca Los Olivos", "Finca San José", "Finca La Esperanza"]
      const randomPoints = Math.floor(Math.random() * 10) + 1
      const randomTeam = randomTeams[Math.floor(Math.random() * randomTeams.length)]
      const randomType = ["goal", "client", "achievement", "ranking"][Math.floor(Math.random() * 4)]
      const teamInitial = randomTeam.charAt(0)

      const newItem = {
        id: Date.now(),
        type: randomType,
        team: randomTeam,
        points: randomPoints,
        product: randomProducts[Math.floor(Math.random() * randomProducts.length)],
        client: randomClients[Math.floor(Math.random() * randomClients.length)],
        achievement: ["¡5 ventas consecutivas!", "¡Nuevo récord!", "¡Objetivo semanal completado!"][
          Math.floor(Math.random() * 3)
        ],
        change: Math.random() > 0.5 ? "up" : "down",
        position: Math.floor(Math.random() * 10) + 1,
        time: "Justo ahora",
        avatar: `/placeholder.svg?height=40&width=40&query=${teamInitial}`,
      }

      // setFeed((prev) => [newItem, ...prev.slice(0, 9)])
      setNewNotification(true)

      // Update "Justo ahora" to "Hace X minutos" after some time
      setTimeout(() => {
        // setFeed((prev) => prev.map((item) => (item.id === newItem.id ? { ...item, time: "Hace 1 minuto" } : item)))
      }, 60000)
    }, 45000) // New notification every 45 seconds

    return () => clearInterval(interval)
  }, [])

  // Flash notification bell when new notification arrives
  useEffect(() => {
    if (newNotification && !expanded) {
      const timeout = setTimeout(() => {
        setNewNotification(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [newNotification, expanded])

  const toggleExpanded = () => {
    setExpanded(!expanded)
    if (!expanded) {
      setNewNotification(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mb-2 w-80 rounded-lg border bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">Actividad en Vivo</h3>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                En directo
              </Badge>
            </div>
            <ScrollArea className="h-80">
              <div className="p-3">
                {feed.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={index === 0 ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index === 0 ? 0.1 : 0 }}
                    className="mb-3 flex items-start gap-3 rounded-lg border p-3 last:mb-0"
                  >
                    <Avatar>
                      <AvatarImage src={item.avatar || "/placeholder.svg"} alt={item.team} />
                      <AvatarFallback>{item.team.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.team}</span>
                        {item.type === "goal" && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {item.type === "client" && <Star className="h-4 w-4 text-blue-500" />}
                        {item.type === "achievement" && <Award className="h-4 w-4 text-purple-500" />}
                        {item.type === "ranking" && (
                          <>
                            {item.change === "up" ? (
                              <ArrowUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-red-500" />
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.type === "goal" && (
                          <>
                            <span className="font-medium text-green-600">+{item.points} puntos</span> por venta de{" "}
                            {item.product}
                          </>
                        )}
                        {item.type === "client" && (
                          <>
                            <span className="font-medium text-blue-600">+{item.points} puntos</span> por captar a{" "}
                            {item.client}
                          </>
                        )}
                        {item.type === "achievement" && (
                          <>
                            <span className="font-medium text-purple-600">+{item.points} puntos</span> por logro:{" "}
                            {item.achievement}
                          </>
                        )}
                        {item.type === "ranking" && (
                          <>
                            {item.change === "up" ? "Subió" : "Bajó"} al puesto{" "}
                            <span className="font-medium">{item.position}</span> en el ranking
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center">
        <Button
          onClick={toggleExpanded}
          className={`rounded-full ${expanded ? "bg-gray-200 text-gray-700" : "bg-corteva-600 text-white"} p-3 shadow-lg hover:bg-corteva-600`}
          size="icon"
        >
          {newNotification && !expanded ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.2, 1] }}
              transition={{ repeat: 5, duration: 0.6 }}
            >
              <Bell className="h-6 w-6" />
            </motion.div>
          ) : (
            <Bell className="h-6 w-6" />
          )}
        </Button>
        {newNotification && !expanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-2 rounded-lg bg-white p-2 shadow-lg"
          >
            <p className="text-sm font-medium">¡Nueva actividad!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
