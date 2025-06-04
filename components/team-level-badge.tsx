import { cn } from "@/lib/utils"

interface TeamLevelBadgeProps {
  position: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function TeamLevelBadge({ position, size = "md", showLabel = true, className }: TeamLevelBadgeProps) {
  const getLevel = () => {
    switch (position) {
      case 1:
        return "oro"
      case 2:
        return "plata"
      case 3:
        return "bronce"
      default:
        return null
    }
  }

  const level = getLevel()

  // Si no está en los primeros 3 lugares, no mostrar badge
  if (!level) {
    return null
  }

  const getLevelColor = () => {
    switch (level) {
      case "bronce":
        return "from-amber-300 to-amber-600 text-amber-950"
      case "plata":
        return "from-gray-300 to-gray-500 text-gray-950"
      case "oro":
        return "from-yellow-300 to-yellow-600 text-yellow-950"
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
      default:
        return ""
    }
  }

  const getMedal = () => {
    switch (position) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return ""
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
        {getMedal()}
      </div>
      {showLabel && <span className="text-sm font-medium">{getLevelLabel()}</span>}
    </div>
  )
}
