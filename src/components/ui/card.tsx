import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border border-border bg-card/70 backdrop-blur", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
