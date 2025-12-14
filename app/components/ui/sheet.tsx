import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined)

const Sheet = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children?: React.ReactNode }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetTrigger must be used within Sheet")
  
  const handleClick = () => {
    context.onOpenChange(true)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: (e: React.MouseEvent) => {
        handleClick()
        if (children.props.onClick) {
          children.props.onClick(e)
        }
      },
      ...props
    })
  }
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" | "top" | "bottom" }
>(({ className, side = "right", children, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context) throw new Error("SheetContent must be used within Sheet")
  
  if (!context.open) return null
  
  const sideClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  }
  
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => context.onOpenChange(false)}
      />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 bg-white shadow-lg transition-transform flex flex-col",
          side === "left" || side === "right" ? "w-full sm:w-auto sm:max-w-md h-full" : "w-full h-auto max-h-[90vh]",
          sideClasses[side],
          className
        )}
        {...props}
      >
        <button
          onClick={() => context.onOpenChange(false)}
          className="sticky top-0 right-0 self-end z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-white/90 backdrop-blur-sm p-2 m-2 sm:absolute sm:m-0 sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }

