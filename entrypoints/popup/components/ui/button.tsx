import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg active:scale-[0.98]",
        destructive: "bg-error text-white shadow-md hover:bg-error-dark hover:shadow-lg active:scale-[0.98]",
        outline: "border border-border bg-transparent hover:bg-background-card hover:border-border-light hover:text-foreground active:scale-[0.98]",
        secondary: "bg-background-card text-foreground shadow-sm hover:bg-background-card/80 active:scale-[0.98]",
        ghost: "hover:bg-background-card/60 hover:text-foreground",
        link: "text-primary-400 underline-offset-4 hover:underline hover:text-primary-300",
        success: "bg-success text-white shadow-md hover:bg-success-dark hover:shadow-lg active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }