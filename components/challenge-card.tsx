import { Trophy, Clock, Users, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ChallengeCardProps {
  title: string
  description: string
  reward: number
  deadline: string
  progress: number
  total: number
  type: "team" | "individual" | "zone"
  difficulty: "easy" | "medium" | "hard"
}

export function ChallengeCard({
  title,
  description,
  reward,
  deadline,
  progress,
  total,
  type,
  difficulty,
}: ChallengeCardProps) {
  const percentage = Math.round((progress / total) * 100)
  const isCompleted = progress >= total

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "bg-green-50 text-green-700 border-green-200"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "hard":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getTypeIcon = () => {
    switch (type) {
      case "team":
        return <Users className="h-4 w-4" />
      case "individual":
        return <Zap className="h-4 w-4" />
      case "zone":
        return <Trophy className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case "team":
        return "Equipo"
      case "individual":
        return "Individual"
      case "zone":
        return "Zona"
      default:
        return "Desafío"
    }
  }

  return (
    <Card
      className={`overflow-hidden border-2 transition-all hover:shadow-md ${isCompleted ? "border-green-500" : "border-green-200"}`}
    >
      <div className="h-1.5 w-full bg-corteva-600"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <Badge variant="outline" className={getDifficultyColor()}>
            {difficulty === "easy" ? "Fácil" : difficulty === "medium" ? "Medio" : "Difícil"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Finaliza: {deadline}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-corteva-600">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>+{reward} puntos</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="font-medium">Progreso:</div>
          <div className={`text-lg font-bold ${isCompleted ? "text-green-600" : ""}`}>
            {progress} / {total} {isCompleted && "✓"}
          </div>
        </div>

        {isCompleted && <div className="mt-2 text-center text-sm font-medium text-green-600">¡Desafío completado!</div>}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Ver detalles
        </Button>
      </CardFooter>
    </Card>
  )
}
