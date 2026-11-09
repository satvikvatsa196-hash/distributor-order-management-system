"use client"

import * as React from "react"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  title?: string
  description?: string
  message?: string
  variant: ToastVariant
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (opts: ToastOptions | string) => void
  addToast: (message: string, variant?: ToastVariant) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (opts: ToastOptions | string) => {
      const id = `toast-${++toastCounter}`
      const item: ToastItem =
        typeof opts === "string"
          ? { id, message: opts, variant: "info" }
          : {
              id,
              title: opts.title,
              description: opts.description,
              variant: opts.variant || "info",
            }

      setToasts((prev) => [...prev, item])

      setTimeout(() => {
        removeToast(id)
      }, 3500)
    },
    [removeToast]
  )

  const addToast = React.useCallback(
    (message: string, variant: ToastVariant = "info") => {
      toast({ description: message, variant })
    },
    [toast]
  )

  const value = React.useMemo(
    () => ({ toasts, toast, addToast, removeToast }),
    [toasts, toast, addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs transition-all animate-in slide-in-from-bottom-2 ${
              t.variant === "success"
                ? "bg-emerald-950 text-emerald-100 border-emerald-800"
                : t.variant === "error"
                ? "bg-red-950 text-red-100 border-red-800"
                : t.variant === "warning"
                ? "bg-amber-950 text-amber-100 border-amber-800"
                : "bg-slate-900 text-slate-100 border-slate-700"
            }`}
          >
            {t.title && <div className="font-bold text-sm leading-tight">{t.title}</div>}
            {(t.description || t.message) && (
              <div className="mt-0.5 opacity-90">{t.description || t.message}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
