import * as React from "react"
import { cn } from "@/lib/utils"

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CREDIT_HOLD"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-800",
  },
  CREDIT_HOLD: {
    label: "Credit Hold",
    className: "bg-red-100 text-red-800",
  },
  DISPATCHED: {
    label: "Dispatched",
    className: "bg-purple-100 text-purple-800",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600",
  },
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
      {...props}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-amber-500": status === "PENDING",
          "bg-blue-500": status === "CONFIRMED",
          "bg-red-500": status === "CREDIT_HOLD",
          "bg-purple-500": status === "DISPATCHED",
          "bg-emerald-500": status === "DELIVERED",
          "bg-slate-400": status === "CANCELLED",
        })}
      />
      {config.label}
    </span>
  )
}

export { StatusBadge, type OrderStatus }
