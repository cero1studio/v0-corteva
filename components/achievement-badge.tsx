import { Award, Crown, Star, Target, Trophy, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type AchievementType = "gold" | "silver" | "bronze" | "platinum" | "diamond" | "special"
type IconType = "trophy" | "award" | "crown" | "star" | "target" | "zap"

interface AchievementBadgeProps {
  type: AchievementType
  name: string
  description: string
  icon: IconType
  progress: number
  unlocked?: boolean
}

export function AchievementBadge({ type, name, description, icon, progress, unlocked = false }: AchievementBadgeProps) {
  // Mapeo de iconos
  const iconMap = {
    trophy: Trophy,
    award: Award,
    crown: Crown,
    star: Star,
    target: Target,
    zap: Zap,
  }

  // Colores según el tipo
  const colors = {
    gold: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      icon: "text-yellow-500",
      progress: "bg-yellow-500",
    },
    silver: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-700",
      icon: "text-gray-500",
      progress: "bg-gray-500",
    },
    bronze: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      icon: "text-amber-500",
      progress: "bg-amber-500",
    },
    platinum: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: "text-blue-500",
      progress: "bg-blue-500",
    },
    diamond: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      icon: "text-purple-500",
      progress: "bg-purple-500",
    },
    special: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      icon: "text-green-500",
      progress: "bg-green-500",
    },
  }

  const IconComponent = iconMap[icon]
  const color = colors[type]

  return (
    <div
      className={`rounded-lg border p-4 ${color.bg} ${color.border} ${
        unlocked ? "opacity-100" : "opacity-70"
      } transition-all hover:opacity-100`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`rounded-full p-2 ${color.bg} ${color.icon}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        <div>
          <h3 className={`font-semibold ${color.text}`}>{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={unlocked ? "font-medium " + color.text : "text-muted-foreground"}>
            {unlocked ? "¡Desbloqueado!" : `${progress}% completado`}
          </span>
          {!unlocked && <span className="text-muted-foreground">{progress}%</span>}
        </div>
        <Progress value={progress} className={`h-1.5 ${color.progress}`} />
      </div>
    </div>
  )
}
