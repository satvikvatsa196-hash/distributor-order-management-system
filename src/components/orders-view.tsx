"use client"

import React, { useState, useEffect } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Package,
  Repeat,
  FileText,
  Calendar,
  Gift,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react"

interface OrdersViewProps {
  language: "en" | "hi"
  onNavigateCatalogue: () => void
}

export function OrdersView({ language, onNavigateCatalogue }: OrdersViewProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { addItem, clearCart } = useCart()
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error("Failed to load orders:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleRepeatOrder = (order: any) => {
    clearCart()
    let count = 0
    for (const item of order.items) {
      if (!item.isFreeGood && item.product) {
        addItem(
          {
            id: item.productId,
            skuCode: item.product.skuCode,
            name: item.product.name,
            retailerPrice: item.unitPrice,
            stock: item.product.stock || 999,
            unit: item.product.unit || "case",
          },
          item.quantity
        )
        count++
      }
    }

    toast({
      title: "Cart Re-populated!",
      description: `${count} products from ${order.orderNumber} loaded into your cart.`,
      variant: "success",
    })

    onNavigateCatalogue()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === "hi" ? "ऑर्डर इतिहास" : "Order History"}
          </h2>
          <p className="text-xs text-slate-500">
            Track deliveries, credit status and repeat frequent orders in 1 click.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="text-xs text-slate-600 gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={language === "hi" ? "कोई पिछला ऑर्डर नहीं" : "No orders found"}
          description={
            language === "hi"
              ? "आपने अभी तक कोई ऑर्डर नहीं दिया है। कैटलॉग देखें और पहला ऑर्डर करें।"
              : "You haven't placed any orders yet. Browse catalogue or use AI order capture."
          }
          actionLabel={language === "hi" ? "कैटलॉग देखें" : "Browse Catalogue"}
          onAction={onNavigateCatalogue}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            let freeGoodsList: any[] = []
            try {
              if (order.freeGoods) freeGoodsList = JSON.parse(order.freeGoods)
            } catch (e) {}

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 transition space-y-3"
              >
                {/* Header: Order Number, Date, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {order.orderNumber}
                      </span>
                      {order.source?.startsWith("AI_") && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          AI Captured
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {dateStr}
                    </div>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* Items preview */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-1">
                  {order.items?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="truncate pr-2">
                        {item.quantity}× {item.product?.name || "Product"}
                        {item.isFreeGood && (
                          <span className="text-emerald-700 font-bold ml-1.5 text-[10px] bg-emerald-100 px-1 rounded">
                            FREE SCHEME
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-700">
                        ₹{item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="text-[11px] text-slate-400 pt-0.5 italic">
                      + {order.items.length - 3} more items...
                    </div>
                  )}
                </div>

                {/* Schemes / Free Goods badge */}
                {freeGoodsList.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Free goods included: {freeGoodsList.map((f) => `${f.quantity}× ${f.name}`).join(", ")}</span>
                  </div>
                )}

                {/* Footer: Amount & Repeat CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500">Order Total: </span>
                    <strong className="text-base font-bold text-slate-900 font-mono">
                      ₹{order.total.toFixed(2)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setIsDetailOpen(true)
                      }}
                      className="text-xs h-8"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      View Invoice
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleRepeatOrder(order)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 font-semibold"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      Repeat Order
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>Order {selectedOrder.orderNumber}</span>
                  <StatusBadge status={selectedOrder.status} />
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} via {selectedOrder.source}
                </DialogDescription>
              </DialogHeader>

              {/* Status explanation */}
              {selectedOrder.status === "CREDIT_HOLD" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    Credit Hold Status
                  </div>
                  <p>
                    This order exceeded your available credit balance. It has been queued for approval by the Jabalpur order desk.
                  </p>
                </div>
              )}

              {/* Items Breakdown */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Billed Line Items
                </h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2 rounded border border-slate-200 bg-slate-50 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.product?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.quantity} cases × ₹{item.unitPrice.toFixed(2)}
                        </div>
                        {item.originalText && (
                          <div className="text-[10px] text-blue-700 italic">
                            Matched from: "{item.originalText}"
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">
                          {item.isFreeGood ? "FREE" : `₹${item.total.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Scheme Discounts:</span>
                    <span className="font-mono">-₹{selectedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST Included (18%):</span>
                  <span className="font-mono">₹{selectedOrder.gstAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-700">₹{selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="text-xs bg-slate-100 p-2 rounded text-slate-700">
                  <strong>Notes: </strong>{selectedOrder.notes}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
