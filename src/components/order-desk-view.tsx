"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { SearchInput } from "@/components/ui/search-input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  FileDown,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Store,
  Layers,
  FileSpreadsheet,
} from "lucide-react"

interface OrderDeskViewProps {
  language: "en" | "hi"
}

export function OrderDeskView({ language }: OrderDeskViewProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isLoadingSheetOpen, setIsLoadingSheetOpen] = useState(false)
  const [loadingSheetData, setLoadingSheetData] = useState<any | null>(null)
  const [loadingSheetBusy, setLoadingSheetBusy] = useState(false)

  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?status=${selectedStatus}&search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error("Failed to load orders for desk:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [selectedStatus, search])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast({
          title: "Order Updated",
          description: `Order marked as ${newStatus}.`,
          variant: "success",
        })
        fetchOrders()
        if (selectedOrder) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    } catch (e) {
      toast({
        title: "Update Failed",
        description: "Could not update order status.",
        variant: "error",
      })
    }
  }

  const handleDownloadTallyXml = () => {
    window.open("/api/desk/export/tally?format=xml", "_blank")
    toast({
      title: "Downloading Tally XML",
      description: "Standard Tally Prime / ERP 9 voucher XML ready for import.",
      variant: "success",
    })
  }

  const handleDownloadTallyCsv = () => {
    window.open("/api/desk/export/tally?format=csv", "_blank")
    toast({
      title: "Downloading CSV",
      description: "Sales ledger CSV exported.",
      variant: "success",
    })
  }

  const handleOpenLoadingSheet = async () => {
    try {
      setLoadingSheetBusy(true)
      const res = await fetch("/api/desk/export/loading-sheet?format=json")
      if (res.ok) {
        const data = await res.json()
        setLoadingSheetData(data)
        setIsLoadingSheetOpen(true)
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Could not generate van loading sheet.",
        variant: "error",
      })
    } finally {
      setLoadingSheetBusy(false)
    }
  }

  const handleDownloadLoadingCsv = () => {
    window.open("/api/desk/export/loading-sheet?format=csv", "_blank")
  }

  const pendingCount = orders.filter((o) => o.status === "PENDING").length
  const creditHoldCount = orders.filter((o) => o.status === "CREDIT_HOLD").length

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Top Banner: Quick Actions (Tally Export, Van Sheet) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Jabalpur Order Desk & Warehouse Operations
            </h2>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Central Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Process kirana orders, resolve credit holds, sync to Tally, and prepare van loading sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleDownloadTallyXml}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-1.5 shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            Tally XML Sync
          </Button>

          <Button
            onClick={handleDownloadTallyCsv}
            variant="outline"
            className="text-xs h-9 font-semibold gap-1.5 text-slate-700 border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel/CSV
          </Button>

          <Button
            onClick={handleOpenLoadingSheet}
            loading={loadingSheetBusy}
            variant="outline"
            className="text-xs h-9 font-semibold gap-1.5 text-blue-700 border-blue-300 bg-blue-50/50 hover:bg-blue-100"
          >
            <Truck className="w-4 h-4 text-blue-600" />
            Van Loading Sheet
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by order number (ORD-...), shop name, or phone..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "PENDING", label: `Pending AI (${pendingCount})` },
              { id: "CREDIT_HOLD", label: `Credit Hold (${creditHoldCount})` },
              { id: "CONFIRMED", label: "Confirmed" },
              { id: "DISPATCHED", label: "Dispatched" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse h-24" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
          No orders found matching the selected filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Kirana / Retailer</th>
                  <th className="p-3">Credit Check</th>
                  <th className="p-3">Items & Schemes</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const creditLimit = order.user?.creditLimit || 50000
                  const creditUsed = order.user?.creditUsed || 0
                  const isExceeded = order.status === "CREDIT_HOLD"

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <div>{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">
                          {order.user?.shopName || order.user?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {order.user?.phone}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-[11px]">
                          Limit: ₹{creditLimit.toLocaleString()}
                        </div>
                        <div className={`text-[11px] font-semibold ${isExceeded ? "text-red-600 font-bold" : "text-slate-500"}`}>
                          Used: ₹{creditUsed.toLocaleString()}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium">
                          {order.items?.length || 0} SKUs (
                          {order.items?.reduce((s: number, i: any) => s + i.quantity, 0)} cases)
                        </div>
                        {order.source?.startsWith("AI_") && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Message
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{order.total.toFixed(2)}
                      </td>

                      <td className="p-3">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {order.status === "CREDIT_HOLD" && (
                            <Button
                              onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2 font-semibold shadow-2xs"
                              title="Override and approve credit hold"
                            >
                              Approve
                            </Button>
                          )}

                          {order.status === "PENDING" && (
                            <Button
                              onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 px-2 font-semibold shadow-2xs"
                            >
                              Confirm
                            </Button>
                          )}

                          {order.status === "CONFIRMED" && (
                            <Button
                              onClick={() => handleUpdateStatus(order.id, "DISPATCHED")}
                              size="sm"
                              variant="outline"
                              className="text-purple-700 border-purple-300 hover:bg-purple-50 text-[11px] h-7 px-2 font-semibold"
                            >
                              Dispatch
                            </Button>
                          )}

                          <Button
                            onClick={() => setSelectedOrder(order)}
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 text-[11px] h-7 px-2"
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Van Loading Sheet Modal */}
      <Dialog open={isLoadingSheetOpen} onOpenChange={setIsLoadingSheetOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Delivery Van Loading Sheet
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadLoadingCsv}
                className="text-xs h-8 gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Aggregated case quantities for warehouse loaders and delivery drops for Jabalpur routes.
            </DialogDescription>
          </DialogHeader>

          {loadingSheetData && (
            <div className="space-y-4 pt-2">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700 font-semibold">Total Cases to Load</div>
                  <div className="text-2xl font-black text-blue-900 font-mono">
                    {loadingSheetData.totalCasesToLoad}
                  </div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Stores to Deliver</div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    {loadingSheetData.totalOrders}
                  </div>
                </div>
              </div>

              {/* Warehouse SKU Loading Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  1. Warehouse Truck Loading Counts (By SKU)
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">SKU Code</th>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-right">Billed Cases</th>
                        <th className="p-2.5 text-right">Free Scheme Cases</th>
                        <th className="p-2.5 text-right font-bold text-slate-900">Total Cases</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingSheetData.warehouseSummary?.map((sku: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-600">{sku.skuCode}</td>
                          <td className="p-2.5 font-bold text-slate-900">{sku.name}</td>
                          <td className="p-2.5 text-right font-mono">{sku.billedCases}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-700">
                            {sku.freeCases > 0 ? `+${sku.freeCases}` : "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-slate-900 text-sm">
                            {sku.totalCases}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Retail Store Drop Sequence */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  2. Retail Store Delivery Drops
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {loadingSheetData.deliveryDrops?.map((drop: any) => (
                    <div
                      key={drop.dropSequence}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          Stop #{drop.dropSequence}: {drop.shopName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {drop.orderNumber} • {drop.address} • {drop.phone}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-blue-700 font-mono">
                          {drop.totalCases} cases
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ₹{drop.orderTotal.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>Order {selectedOrder.orderNumber}</span>
                  <StatusBadge status={selectedOrder.status} />
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {selectedOrder.user?.shopName} ({selectedOrder.user?.phone})
                </DialogDescription>
              </DialogHeader>

              {/* Items Breakdown */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Order Line Items
                </h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded border border-slate-200 bg-slate-50 text-xs flex justify-between items-center"
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
                            Original text: "{item.originalText}"
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

              {/* Status Actions */}
              <DialogFooter className="mt-4 gap-2">
                {selectedOrder.status === "CREDIT_HOLD" && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3"
                  >
                    Approve Credit Hold
                  </Button>
                )}

                {selectedOrder.status !== "DISPATCHED" && selectedOrder.status !== "CANCELLED" && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "DISPATCHED")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-3"
                  >
                    Mark Dispatched
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
