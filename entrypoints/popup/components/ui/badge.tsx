import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-500 text-white shadow hover:bg-primary-600",
        secondary: "border-transparent bg-background-card text-foreground hover:bg-background-card/80",
        destructive: "border-transparent bg-error text-white shadow hover:bg-error-dark",
        outline: "text-foreground border border-border",
        nse: "border-transparent bg-primary-500/20 text-primary-400 border border-primary-500/30",
        bse: "border-transparent bg-warning/20 text-warning border border-warning/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }