"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string
  onChange: (value: string) => void
  debounceMs?: number
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { className, value: controlledValue, onChange, debounceMs = 300, placeholder = "Search...", ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      controlledValue ?? ""
    )
    const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

    // Sync with controlled value
    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue)
      }
    }, [controlledValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue)
      }, debounceMs)
    }

    const handleClear = () => {
      setInternalValue("")
      onChange("")
    }

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }, [])

    return (
      <div className={cn("relative w-full", className)}>
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={ref}
          type="search"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label={typeof placeholder === "string" ? placeholder : "Search"}
          {...props}
        />

        {/* Clear button */}
        {internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
