import { cn } from "@/lib/utils"

interface ColorSwatchProps {
  color: string
  name: string
  hex: string
  description?: string
  className?: string
}

export function ColorSwatch({ color, name, hex, description, className }: ColorSwatchProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className={cn("mb-3 h-20 rounded-md", color)}></div>
      <div className="flex justify-between">
        <span className="font-medium">{name}</span>
        <span className="font-mono text-sm">{hex}</span>
      </div>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
