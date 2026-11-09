"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItemInput {
  productId: string
  skuCode: string
  name: string
  nameHindi?: string
  unitPrice: number
  quantity: number
  unit: string
  stock: number
  schemes: any[]
}

interface CartContextType {
  items: CartItemInput[]
  addItem: (product: any, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  totalItemCount: number
  subtotal: number
  calculatedResult: any | null
  isCalculating: boolean
  recalculate: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemInput[]>([])
  const [calculatedResult, setCalculatedResult] = useState<any | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Load cart from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jabalpur_cart")
      if (saved) {
        setItems(JSON.parse(saved))
      }
    } catch (e) {}
  }, [])

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem("jabalpur_cart", JSON.stringify(items))
    } catch (e) {}
    recalculate()
  }, [items])

  const recalculate = async () => {
    if (items.length === 0) {
      setCalculatedResult(null)
      return
    }

    try {
      setIsCalculating(true)
      const res = await fetch("/api/orders/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCalculatedResult(data)
      }
    } catch (e) {
      console.error("Failed to calculate cart schemes:", e)
    } finally {
      setIsCalculating(false)
    }
  }

  const addItem = (product: any, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(product.stock, i.quantity + quantity) }
            : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          skuCode: product.skuCode,
          name: product.name,
          nameHindi: product.nameHindi,
          unitPrice: product.retailerPrice || product.dealerPrice,
          quantity: Math.min(product.stock, quantity),
          unit: product.unit || "case",
          stock: product.stock,
          schemes: product.schemes || [],
        },
      ]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const clearCart = () => {
    setItems([])
    setCalculatedResult(null)
    localStorage.removeItem("jabalpur_cart")
  }

  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItemCount,
        subtotal,
        calculatedResult,
        isCalculating,
        recalculate,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

