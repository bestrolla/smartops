import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white",
            "hover:border-smartops-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-smartops-blue focus-visible:ring-offset-2",
            checked && "bg-smartops-blue border-smartops-blue text-white",
            className
          )}
          onClick={() => onCheckedChange?.(!checked)}
        >
          {checked && <Check className="h-3 w-3" />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox } 