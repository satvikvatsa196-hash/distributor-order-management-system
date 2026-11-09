"use client"

import React, { useState, useEffect } from "react"
import { CartProvider } from "@/lib/cart-context"
import { Navbar } from "@/components/navbar"
import { CatalogueView } from "@/components/catalogue-view"
import { OrdersView } from "@/components/orders-view"
import { OrderDeskView } from "@/components/order-desk-view"
import { InactiveRetailersView } from "@/components/inactive-retailers-view"
import { AIOrderModal } from "@/components/ai-order-modal"
import { CartDrawer } from "@/components/cart-drawer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react"

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("catalogue")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any | null>(null)

  const handleOrderSuccess = (order: any) => {
    setLastPlacedOrder(order)
  }

  const handleStartOrderForRetailer = (retailer: any) => {
    // Salesman mode: switch to this retailer
    fetch("/api/auth/demo-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: retailer.phone }),
    }).then(() => {
      window.location.reload()
    })
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100">
        {/* Navigation Bar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          language={language}
          setLanguage={setLanguage}
        />

        {/* Main View Area */}
        <main className="flex-1 pb-16">
          {currentTab === "catalogue" && (
            <CatalogueView
              language={language}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              onOpenCart={() => setIsCartOpen(true)}
            />
          )}

          {currentTab === "orders" && (
            <OrdersView
              language={language}
              onNavigateCatalogue={() => setCurrentTab("catalogue")}
            />
          )}

          {currentTab === "order_desk" && (
            <OrderDeskView language={language} />
          )}

          {currentTab === "inactive_retailers" && (
            <InactiveRetailersView
              language={language}
              onStartOrderForRetailer={handleStartOrderForRetailer}
            />
          )}
        </main>

        {/* Modals & Drawers */}
        <AIOrderModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          language={language}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          language={language}
          onOrderSuccess={handleOrderSuccess}
        />

        {/* Order Placement Confirmation Modal */}
        <Dialog
          open={!!lastPlacedOrder}
          onOpenChange={() => setLastPlacedOrder(null)}
        >
          <DialogContent className="max-w-sm text-center">
            {lastPlacedOrder && (
              <div className="py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <DialogTitle className="text-lg font-bold text-slate-900">
                  {lastPlacedOrder.status === "CREDIT_HOLD"
                    ? "Order Placed (Credit Review)"
                    : "Order Placed Successfully!"}
                </DialogTitle>

                <DialogDescription className="text-xs text-slate-500">
                  Order Ref: <strong className="text-slate-800 font-mono">{lastPlacedOrder.orderNumber}</strong>
                </DialogDescription>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Cases:</span>
                    <strong className="text-slate-800">
                      {lastPlacedOrder.items?.reduce((s: number, i: any) => s + i.quantity, 0)} cases
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Amount:</span>
                    <strong className="text-blue-700 font-mono text-sm">
                      ₹{lastPlacedOrder.total?.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <strong className={lastPlacedOrder.status === "CREDIT_HOLD" ? "text-amber-700" : "text-emerald-700"}>
                      {lastPlacedOrder.status}
                    </strong>
                  </div>
                </div>

                {lastPlacedOrder.status === "CREDIT_HOLD" && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    This order exceeded available credit. The office order desk in Jabalpur has received an alert for approval.
                  </p>
                )}

                <DialogFooter className="mt-4 flex-col gap-2">
                  <Button
                    onClick={() => {
                      setLastPlacedOrder(null)
                      setCurrentTab("orders")
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
                  >
                    View in Order History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLastPlacedOrder(null)}
                    className="w-full text-xs h-9"
                  >
                    Continue Shopping
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
  )
}
