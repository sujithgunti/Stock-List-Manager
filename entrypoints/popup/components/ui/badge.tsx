import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-500 text-white shadow-sm hover:bg-primary-600",
        secondary: "bg-background-muted text-foreground-muted border border-border/50",
        destructive: "border-transparent bg-error/90 text-white shadow-sm hover:bg-error",
        outline: "text-foreground-muted border border-border/60 bg-transparent",
        nse: "bg-primary-500/15 text-primary-400 border border-primary-500/25 font-semibold",
        bse: "bg-warning/15 text-warning border border-warning/25 font-semibold",
        success: "bg-success/15 text-success border border-success/25",
        count: "bg-background-muted text-foreground-muted text-[10px] px-1.5 py-0 font-normal",
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