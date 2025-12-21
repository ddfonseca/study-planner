"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/useMediaQuery"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const ResponsiveDialog = ({ children, ...props }: ResponsiveDialogProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <Drawer {...props}>{children}</Drawer>
  }

  return <Dialog {...props}>{children}</Dialog>
}

const ResponsiveDialogTrigger = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTrigger>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerTrigger className={className} {...props}>
        {children}
      </DrawerTrigger>
    )
  }

  return (
    <DialogTrigger className={className} {...props}>
      {children}
    </DialogTrigger>
  )
}

const ResponsiveDialogClose = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogClose>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerClose className={className} {...props}>
        {children}
      </DrawerClose>
    )
  }

  return (
    <DialogClose className={className} {...props}>
      {children}
    </DialogClose>
  )
}

interface ResponsiveDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  drawerClassName?: string
}

const ResponsiveDialogContent = ({
  className,
  drawerClassName,
  children,
  ...props
}: ResponsiveDialogContentProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={cn("px-4 pb-6", drawerClassName)}>
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

const ResponsiveDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />
  }

  return <DialogHeader className={className} {...props} />
}

const ResponsiveDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerFooter className={className} {...props} />
  }

  return <DialogFooter className={className} {...props} />
}

const ResponsiveDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTitle ref={ref} className={className} {...props} />
  }

  return <DialogTitle ref={ref} className={className} {...props} />
})
ResponsiveDialogTitle.displayName = "ResponsiveDialogTitle"

const ResponsiveDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerDescription ref={ref} className={className} {...props} />
  }

  return <DialogDescription ref={ref} className={className} {...props} />
})
ResponsiveDialogDescription.displayName = "ResponsiveDialogDescription"

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
}
