"use client"

import React, { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { useToast } from "@/components/ui/use-toast"
import {
  X,
  ShoppingCart,
  Gift,
  Tag,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileText,
  Clock,
} from "lucide-react"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  language: "en" | "hi"
  onOrderSuccess: (order: any) => void
}

export function CartDrawer({ isOpen, onClose, language, onOrderSuccess }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, calculatedResult, isCalculating } = useCart()
  const { toast } = useToast()

  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Fetch current user credit limit info
  React.useEffect(() => {
    if (isOpen) {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setCurrentUser(data.user)
        })
        .catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  const subtotal = calculatedResult?.subtotal || items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discount = calculatedResult?.totalDiscount || 0
  const total = calculatedResult?.total || subtotal - discount
  const gstAmount = calculatedResult?.gstAmount || Math.round(((total * 18) / 118) * 100) / 100
  const freeGoods = calculatedResult?.freeGoodsSummary || []

  // Credit calculation
  const creditLimit = currentUser?.creditLimit || 50000
  const creditUsed = currentUser?.creditUsed || 0
  const remainingCredit = Math.max(0, creditLimit - creditUsed)
  const willExceedCredit = total > remainingCredit

  const handlePlaceOrder = async () => {
    if (items.length === 0) return

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          notes,
          source: "APP",
        }),
      })

      const data = await res.json()

      if (res.ok) {
        clearCart()
        toast({
          title: data.isCreditExceeded ? "Order under Credit Hold" : "Order Placed Successfully!",
          description: data.message,
          variant: data.isCreditExceeded ? "warning" : "success",
        })
        onClose()
        onOrderSuccess(data.order)
      } else {
        toast({
          title: "Order Failed",
          description: data.error || "Could not place order. Check stock.",
          variant: "error",
        })
      }
    } catch (e: any) {
      toast({
        title: "Network Error",
        description: "Failed to submit order. Please try again.",
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                {language === "hi" ? "आपका ऑर्डर कार्ट" : "Your Order Cart"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {items.length} {items.length === 1 ? "product" : "products"} selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">
                {language === "hi" ? "कार्ट खाली है" : "Your cart is empty"}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                {language === "hi"
                  ? "कैटलॉग से सामान जोड़ें या व्हाट्सएप टेक्स्ट पेस्ट करके तुरंत ऑर्डर बनाएं।"
                  : "Add products from the catalogue or use AI order capture."}
              </p>
            </div>
          ) : (
            <>
              {items.map((item) => {
                const lineResult = calculatedResult?.items?.find(
                  (i: any) => i.productId === item.productId
                )
                const lineTotal = lineResult ? lineResult.lineTotal - lineResult.discount : item.unitPrice * item.quantity

                return (
                  <div
                    key={item.productId}
                    className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {item.name}
                        </h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {item.skuCode} • ₹{item.unitPrice.toFixed(2)}/{item.unit}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Applied Scheme Tag for this line */}
                    {lineResult?.appliedScheme && (
                      <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{lineResult.schemeBreakdown}</span>
                      </div>
                    )}

                    {/* Quantity controls and Line Total */}
                    <div className="flex items-center justify-between pt-1">
                      <QuantitySelector
                        value={item.quantity}
                        max={item.stock}
                        onChange={(qty) => updateQuantity(item.productId, qty)}
                        unit="case"
                      />

                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900">
                          ₹{lineTotal.toFixed(2)}
                        </div>
                        {lineResult?.discount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Save ₹{lineResult.discount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Free Goods Preview */}
              {freeGoods.length > 0 && (
                <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span>Free Goods Earned via Schemes:</span>
                  </div>
                  {freeGoods.map((fg: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs text-emerald-800 flex items-center justify-between font-medium pl-5"
                    >
                      <span>• {fg.name}</span>
                      <strong className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px]">
                        +{fg.quantity} Case Free
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Notes / Instructions */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Delivery Notes / Dispatch instructions:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver before 12 PM with van route #3..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              {/* Credit Limit Meter */}
              {currentUser && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    willExceedCredit
                      ? "bg-red-50 border-red-200 text-red-900"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Credit Check:</span>
                    <span>
                      Available: ₹{remainingCredit.toLocaleString()} / Limit: ₹{creditLimit.toLocaleString()}
                    </span>
                  </div>

                  {willExceedCredit ? (
                    <div className="flex items-start gap-1.5 text-red-700 text-[11px] font-medium leading-tight">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                      <span>
                        This order (₹{total.toFixed(0)}) exceeds your available credit by ₹{(total - remainingCredit).toFixed(0)}. It will be flagged for <strong>CREDIT HOLD</strong> review by the order desk.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Within pre-approved credit limit.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Calculation Breakdown & Order Placement */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} cases)</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Scheme Slab Discount
                  </span>
                  <span className="font-mono">-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Estimated 18% GST (Included in price)</span>
                <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-blue-700 font-mono">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <Button
              onClick={handlePlaceOrder}
              loading={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm shadow-md"
            >
              {willExceedCredit
                ? "Submit Order (Credit Hold Review)"
                : language === "hi"
                ? "ऑर्डर कन्फर्म करें"
                : "Confirm & Place Order"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

