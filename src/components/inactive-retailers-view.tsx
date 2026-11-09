"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertTriangle,
  Phone,
  Store,
  User,
  Calendar,
  PlusCircle,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react"

interface InactiveRetailersViewProps {
  language: "en" | "hi"
  onStartOrderForRetailer: (retailer: any) => void
}

export function InactiveRetailersView({
  language,
  onStartOrderForRetailer,
}: InactiveRetailersViewProps) {
  const [inactiveRetailers, setInactiveRetailers] = useState<any[]>([])
  const [summary, setSummary] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const { toast } = useToast()

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/desk/analytics")
      if (res.ok) {
        const data = await res.json()
        setInactiveRetailers(data.inactiveRetailers || [])
        setSummary(data.summary)
      }
    } catch (e) {
      console.error("Failed to load inactive retailers:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const filtered = inactiveRetailers.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.shopName?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.salesmanName?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Overview Banner */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-amber-950">
              {language === "hi"
                ? "14 दिनों से निष्क्रिय किराना रिटेलर्स"
                : "Retailers with No Order in 14+ Days"}
            </h2>
            <p className="text-xs text-amber-800 mt-0.5">
              Target these stores immediately to prevent churn and protect the ₹90 crore annual distributor target.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-2xl font-black text-amber-900 font-mono">
            {inactiveRetailers.length}
          </span>
          <span className="text-xs text-amber-800 font-medium block">
            At-Risk Kiranas
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by shop name, owner, phone or salesman..."
        />
      </div>

      {/* Retailers List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No inactive retailers"
          description="All retailers have placed orders within the last 14 days."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((retailer) => {
            const days = retailer.daysSinceLastOrder

            return (
              <div
                key={retailer.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-amber-400 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top: Shop Name & Days Inactive Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-blue-600 shrink-0" />
                        {retailer.shopName || retailer.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Owner: {retailer.name} • {retailer.address}
                      </p>
                    </div>

                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 border border-red-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-600" />
                      {days >= 900 ? "Never ordered" : `${days} days inactive`}
                    </span>
                  </div>

                  {/* Metadata Row: Salesman, Last order, Credit */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Salesman:</span>
                      <strong className="text-slate-800">{retailer.salesmanName}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Order Date:</span>
                      <span>
                        {retailer.lastOrderDate
                          ? new Date(retailer.lastOrderDate).toLocaleDateString()
                          : "None"}
                        {retailer.lastOrderAmount > 0 && ` (₹${retailer.lastOrderAmount.toFixed(0)})`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Credit Status:</span>
                      <span>
                        Limit: ₹{retailer.creditLimit?.toLocaleString()} | Available: ₹
                        {(retailer.creditLimit - retailer.creditUsed).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Call, WhatsApp, Order on Visit */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${retailer.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md font-medium transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>

                    <a
                      href={`https://wa.me/91${retailer.phone}?text=Namaste%20${retailer.shopName},%20we%20have%20new%20schemes%20on%20Glucose%20biscuits%20and%20detergent!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-md font-medium transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </a>
                  </div>

                  <Button
                    onClick={() => onStartOrderForRetailer(retailer)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-semibold gap-1.5 shadow-2xs"
                    title="Salesman Mode: create order on shopkeeper's behalf"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Visit Order
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

