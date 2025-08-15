import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

interface CollapsibleCardProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: "default" | "accent"
  className?: string
}

function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
  variant = "default",
  className,
  ...props
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors py-3",
            variant === "accent" && "bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1">{title}</div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleCard }
