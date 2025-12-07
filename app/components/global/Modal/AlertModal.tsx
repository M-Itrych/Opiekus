"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"
import { ModalType } from "./ModalContext"

interface AlertModalProps {
  isOpen: boolean
  type: ModalType
  message: string
  title?: string
  onClose: () => void
  onConfirm?: () => void
  confirmText?: string
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    title: "Sukces",
    buttonVariant: "default" as const,
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    title: "Błąd",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    title: "Ostrzeżenie",
    buttonVariant: "default" as const,
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    title: "Informacja",
    buttonVariant: "default" as const,
  },
}

export function AlertModal({
  isOpen,
  type,
  message,
  title,
  onClose,
  onConfirm,
  confirmText = "OK",
}: AlertModalProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <DialogTitle className="text-left">
              {title || config.title}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-foreground pt-2">
          {message}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

