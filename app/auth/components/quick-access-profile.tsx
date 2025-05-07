"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuickAccessProfileProps {
  title: string
  description: string
  color: string
  onClick: () => void
  image?: string | null
}

export function QuickAccessProfile({ title, description, color, onClick, image }: QuickAccessProfileProps) {
  return (
    <Button variant="outline" className="flex h-auto flex-col items-start gap-1 p-4 text-left" onClick={onClick}>
      <div className="flex w-full items-center gap-3">
        {image ? (
          <img src={image || "/placeholder.svg"} alt={title} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className={cn("h-10 w-10 rounded-full", color)} />
        )}
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </Button>
  )
}
