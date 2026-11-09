"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
  className?: string
  disabled?: boolean
}

function QuantitySelector({
  value,
  onChange,
  min = 0,
  max = Infinity,
  unit,
  className,
  disabled = false,
}: QuantitySelectorProps) {
  const isOutOfStock = max === 0
  const canDecrement = !disabled && !isOutOfStock && value > min
  const canIncrement = !disabled && !isOutOfStock && value < max

  const handleDecrement = () => {
    if (canDecrement) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (canIncrement) {
      onChange(value + 1)
    }
  }

  if (isOutOfStock) {
    return (
      <div
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-400",
          className
        )}
      >
        Out of Stock
      </div>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200",
        disabled && "opacity-50",
        className
      )}
      role="group"
      aria-label={unit ? `Quantity in ${unit}` : "Quantity selector"}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        className="flex h-11 w-11 items-center justify-center rounded-l-lg text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
        aria-label="Decrease quantity"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <div className="flex min-w-[3rem] flex-col items-center justify-center border-x border-slate-200 px-2">
        <span className="text-base font-semibold text-slate-900 tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-[10px] leading-tight text-slate-500">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        className="flex h-11 w-11 items-center justify-center rounded-r-lg text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
        aria-label="Increase quantity"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  )
}

export { QuantitySelector }
