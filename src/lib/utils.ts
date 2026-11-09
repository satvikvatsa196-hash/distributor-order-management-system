import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indian Rupee currency (₹X,XX,XXX.XX).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date as "DD MMM YYYY" (e.g. "09 Nov 2026").
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Generate an order number in the format "ORD-YYYY-XXXX".
 * XXXX is a random 4-digit number zero-padded.
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${year}-${seq}`
}

/**
 * Determine stock status label and color based on current stock and threshold.
 */
export function getStockStatus(
  stock: number,
  threshold: number
): { label: string; color: string } {
  if (stock <= 0) {
    return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' }
  }
  if (stock <= threshold) {
    return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50' }
  }
  return { label: 'In Stock', color: 'text-green-600 bg-green-50' }
}

/**
 * Truncate a string to the given length, appending "…" if truncated.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}
