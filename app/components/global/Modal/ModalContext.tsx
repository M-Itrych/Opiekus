"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { AlertModal } from "./AlertModal"

export type ModalType = "success" | "error" | "info" | "warning"

export interface ModalState {
  isOpen: boolean
  type: ModalType
  title?: string
  message: string
  onConfirm?: () => void
  confirmText?: string
}

interface ModalContextType {
  showModal: (type: ModalType, message: string, options?: {
    title?: string
    onConfirm?: () => void
    confirmText?: string
  }) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: "info",
    message: "",
  })

  const showModal = useCallback((
    type: ModalType,
    message: string,
    options?: {
      title?: string
      onConfirm?: () => void
      confirmText?: string
    }
  ) => {
    setModalState({
      isOpen: true,
      type,
      message,
      title: options?.title,
      onConfirm: options?.onConfirm,
      confirmText: options?.confirmText,
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <AlertModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        message={modalState.message}
        title={modalState.title}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}

