import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-50 text-zinc-900 hover:bg-zinc-50/90",
        destructive:
          "bg-red-900 text-zinc-50 hover:bg-red-900/90",
        outline:
          "border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:text-zinc-50",
        secondary:
          "bg-zinc-800 text-zinc-50 hover:bg-zinc-800/80",
        ghost: "hover:bg-zinc-800 hover:text-zinc-50",
        link: "text-zinc-50 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
