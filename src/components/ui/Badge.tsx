import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-blue-100 text-blue-800",
      success: "bg-emerald-100 text-emerald-800",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-rose-100 text-rose-800",
      outline: "text-slate-800 border border-slate-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
