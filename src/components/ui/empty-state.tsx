import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./button"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: ButtonProps["variant"]
  }
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  const finalLabel = actionLabel || action?.label
  const finalAction = onAction || action?.onClick

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center bg-white rounded-xl border border-slate-200",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {typeof Icon === "function" ? <Icon className="w-7 h-7" /> : Icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-slate-500 leading-relaxed">{description}</p>
      )}
      {finalLabel && finalAction && (
        <Button
          variant={action?.variant || "default"}
          onClick={finalAction}
          className="mt-4 text-xs h-9 font-semibold"
        >
          {finalLabel}
        </Button>
      )}
    </div>
  )
}
