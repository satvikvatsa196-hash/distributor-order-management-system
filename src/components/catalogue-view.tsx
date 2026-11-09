"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { Package, Gift, Tag, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react"

interface CatalogueViewProps {
  language: "en" | "hi"
  onOpenAIModal: () => void
  onOpenCart: () => void
}

export function CatalogueView({ language, onOpenAIModal, onOpenCart }: CatalogueViewProps) {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  const { items, addItem, updateQuantity, removeItem } = useCart()

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/products")
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setCategories(data.categories || [])
      }
    } catch (e) {
      console.error("Failed to load catalogue:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Filter products by category, search query, in-stock toggle
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
        return false
      }
      if (inStockOnly && p.stock <= 0) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesHindi = p.nameHindi?.toLowerCase().includes(q)
        const matchesSku = p.skuCode.toLowerCase().includes(q)
        return matchesName || matchesHindi || matchesSku
      }
      return true
    })
  }, [products, selectedCategory, searchQuery, inStockOnly])

  const getItemQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId)
    return item ? item.quantity : 0
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Quick order banner for AI */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-4 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/30 text-blue-200 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-blue-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {language === "hi" ? "व्हाट्सएप व वॉयस ऑर्डर" : "WhatsApp & Voice Orders"}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold">
            {language === "hi"
              ? "मैसेज या पर्ची भेजकर ऑर्डर करें"
              : "Order from WhatsApp messages, voice notes or photos"}
          </h2>
          <p className="text-xs text-blue-200">
            {language === "hi"
              ? "हिंदी या हिंग्लिश में लिखें - AI तुरंत SKU और स्कीम जोड़ देगा।"
              : "Type in Hindi/Hinglish (e.g. '5 peti biscuit chhota') - AI maps SKUs & schemes instantly."}
          </p>
        </div>

        <Button
          onClick={onOpenAIModal}
          className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 shrink-0 shadow-sm"
        >
          <Sparkles className="w-4 h-4 mr-1.5 text-slate-900" />
          {language === "hi" ? "AI ऑर्डर बनाएं" : "Try AI Order"}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={
                language === "hi"
                  ? "सामान का नाम, SKU या कोड खोजें (उदा: biscuit, chai, 1kg)..."
                  : "Search SKU, Hindi name or product (e.g., biscuit, tea, detergent)..."
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center gap-1.5 h-11 ${
                inStockOnly
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${inStockOnly ? "text-emerald-600" : "text-slate-400"}`} />
              {language === "hi" ? "केवल उपलब्ध स्टॉक" : "In Stock Only"}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {language === "hi" ? "सभी श्रेणियां" : "All Products"} ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={language === "hi" ? "कोई उत्पाद नहीं मिला" : "No products found"}
          description={
            language === "hi"
              ? "कृपया खोज शब्द बदलें या फ़िल्टर हटाएं।"
              : "Try adjusting your search terms or category filter."
          }
          actionLabel={language === "hi" ? "फ़िल्टर रीसेट करें" : "Reset Filters"}
          onAction={() => {
            setSearchQuery("")
            setSelectedCategory("ALL")
            setInStockOnly(false)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map((product) => {
            const qty = getItemQuantity(product.id)
            const isOutOfStock = product.stock <= 0
            const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold

            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl border transition shadow-xs flex flex-col justify-between p-4 ${
                  isOutOfStock
                    ? "border-slate-200 bg-slate-50/70 opacity-80"
                    : "border-slate-200 hover:border-blue-400 hover:shadow-sm"
                }`}
              >
                <div>
                  {/* Top Bar: SKU Code & Stock Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                      {product.skuCode}
                    </span>

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        {language === "hi" ? "स्टॉक समाप्त" : "Out of Stock"}
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        {language === "hi" ? `केवल ${product.stock} पेटी` : `Only ${product.stock} cases left`}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {language === "hi" ? `${product.stock} पेटी उपलब्ध` : `${product.stock} cases in stock`}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {product.name}
                  </h3>
                  {product.nameHindi && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {product.nameHindi}
                    </p>
                  )}

                  {/* Packaging / Unit Details */}
                  <p className="text-xs text-slate-500 mt-1">
                    {product.unitsPerCase > 1
                      ? `${product.unit === "case" ? "Case" : "Pack"} of ${product.unitsPerCase} units`
                      : "Standard Case"}
                  </p>

                  {/* Schemes applied on this product */}
                  {product.schemes && product.schemes.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {product.schemes.map((scheme: any) => (
                        <div
                          key={scheme.id}
                          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2 py-1 rounded-md"
                        >
                          {scheme.type === "BUY_X_GET_Y" ? (
                            <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate">{scheme.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Price & Large Touch Add/Quantity Selector */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-slate-900">
                        ₹{product.retailerPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">/{product.unit}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span>MRP ₹{product.mrp.toFixed(2)}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">Incl. 18% GST</span>
                    </div>
                  </div>

                  {/* Quantity Control (min 44px tap target as required) */}
                  <div className="shrink-0">
                    {isOutOfStock ? (
                      <Button disabled size="sm" variant="outline" className="text-xs text-slate-400">
                        Out of Stock
                      </Button>
                    ) : qty === 0 ? (
                      <Button
                        onClick={() => addItem(product, 1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 h-10 shadow-xs"
                      >
                        + {language === "hi" ? "जोड़ें" : "Add"}
                      </Button>
                    ) : (
                      <QuantitySelector
                        value={qty}
                        max={product.stock}
                        onChange={(newQty) => updateQuantity(product.id, newQty)}
                        unit="case"
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
