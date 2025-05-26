import { cn } from "@/lib/utils"

interface TeamLevelBadgeProps {
  level: "bronce" | "plata" | "oro" | "platino" | "diamante" | "leyenda"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function TeamLevelBadge({ level, size = "md", showLabel = true, className }: TeamLevelBadgeProps) {
  const getLevelColor = () => {
    switch (level) {
      case "bronce":
        return "from-amber-300 to-amber-600 text-amber-950"
      case "plata":
        return "from-gray-300 to-gray-500 text-gray-950"
      case "oro":
        return "from-yellow-300 to-yellow-600 text-yellow-950"
      case "platino":
        return "from-corteva-300 to-corteva-600 text-white"
      case "diamante":
        return "from-purple-300 to-purple-600 text-purple-950"
      case "leyenda":
        return "from-corteva-400 to-corteva-700 text-white"
      default:
        return "from-gray-300 to-gray-500 text-gray-950"
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-6 w-6 text-xs"
      case "md":
        return "h-8 w-8 text-sm"
      case "lg":
        return "h-10 w-10 text-base"
      default:
        return "h-8 w-8 text-sm"
    }
  }

  const getLevelLabel = () => {
    switch (level) {
      case "bronce":
        return "Bronce"
      case "plata":
        return "Plata"
      case "oro":
        return "Oro"
      case "platino":
        return "Platino"
      case "diamante":
        return "Diamante"
      case "leyenda":
        return "Leyenda"
      default:
        return "Bronce"
    }
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br font-bold shadow-sm",
          getLevelColor(),
          getSizeClasses(),
        )}
      >
        {level.charAt(0).toUpperCase()}
      </div>
      {showLabel && <span className="text-sm font-medium">{getLevelLabel()}</span>}
    </div>
  )
}
