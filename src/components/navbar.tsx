"use client"

import React, { useState, useEffect } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ShoppingCart, Sparkles, Building2, UserCheck, RefreshCw, Languages, Store, AlertCircle } from "lucide-react"

interface NavbarProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
  onOpenCart: () => void
  onOpenAIModal: () => void
  language: "en" | "hi"
  setLanguage: (lang: "en" | "hi") => void
}

export function Navbar({
  currentTab,
  setCurrentTab,
  onOpenCart,
  onOpenAIModal,
  language,
  setLanguage,
}: NavbarProps) {
  const { totalItemCount, calculatedResult, subtotal } = useCart()
  const [user, setUser] = useState<any>(null)
  const [isSwitchOpen, setIsSwitchOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/products")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (e) {}
  }

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await fetch("/api/auth/demo-switch")
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      }
    } catch (e) {}
    finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const handleSwitchUser = async (phone: string) => {
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      if (res.ok) {
        setIsSwitchOpen(false)
        window.location.reload()
      }
    } catch (e) {
      alert("Failed to switch user")
    }
  }

  const isOrderDesk = user?.role === "ORDER_DESK" || user?.role === "ADMIN"

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top announcement / user status banner */}
        <div className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white tracking-wide">Company A</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 truncate">Jabalpur FMCG Distributor (1,800 Kiranas)</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Persona Switcher Pill */}
            <button
              onClick={() => {
                fetchAllUsers()
                setIsSwitchOpen(true)
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border border-slate-700 active:scale-95"
              title="Click to test as Retailer, Order Desk, or Salesman"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {user ? `${user.shopName || user.name} (${user.role})` : "Switch Role"}
              </span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                Demo
              </span>
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-full text-xs transition cursor-pointer border border-slate-700"
              title="Toggle Hindi / English"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">{language === "en" ? "हिंदी" : "English"}</span>
            </button>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand & Tabs */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => setCurrentTab("catalogue")}
              className="cursor-pointer flex items-center gap-2 select-none"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                CA
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {language === "hi" ? "किराना ऑर्डर पोर्टल" : "Kirana Order Portal"}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium leading-none">
                  Jabalpur Distribution Hub
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <button
                onClick={() => setCurrentTab("catalogue")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  currentTab === "catalogue"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {language === "hi" ? "कैटलॉग" : "Catalogue"}
              </button>

              <button
                onClick={() => setCurrentTab("orders")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  currentTab === "orders"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {language === "hi" ? "मेरे ऑर्डर्स" : "Orders"}
              </button>

              {isOrderDesk && (
                <>
                  <button
                    onClick={() => setCurrentTab("order_desk")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      currentTab === "order_desk"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {language === "hi" ? "ऑर्डर डेस्क" : "Order Desk"}
                  </button>

                  <button
                    onClick={() => setCurrentTab("inactive_retailers")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      currentTab === "inactive_retailers"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {language === "hi" ? "निष्क्रिय रिटेलर्स (14 दिन)" : "Inactive Stores (14d)"}
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Action Buttons: AI Order & Cart */}
          <div className="flex items-center gap-2">
            {/* AI Order Button */}
            <Button
              onClick={onOpenAIModal}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 bg-blue-50/70 hover:bg-blue-100 gap-1.5 font-medium shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">
                {language === "hi" ? "AI त्वरित ऑर्डर" : "AI Message Order"}
              </span>
              <span className="sm:hidden">AI</span>
            </Button>

            {/* Cart Trigger Button */}
            <Button
              onClick={onOpenCart}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium relative shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === "hi" ? "कार्ट" : "Cart"}
              </span>
              {totalItemCount > 0 && (
                <span className="bg-amber-400 text-slate-900 font-bold text-xs px-1.5 py-0.2 rounded-full">
                  {totalItemCount}
                </span>
              )}
              {calculatedResult?.total ? (
                <span className="hidden md:inline font-semibold text-xs border-l border-blue-400 pl-2">
                  ₹{calculatedResult.total.toFixed(0)}
                </span>
              ) : subtotal > 0 ? (
                <span className="hidden md:inline font-semibold text-xs border-l border-blue-400 pl-2">
                  ₹{subtotal.toFixed(0)}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {/* Credit Limit & Retailer Notice Bar (Only for Retailers) */}
        {user && user.role === "RETAILER" && (
          <div className="bg-blue-50 border-t border-blue-100 px-4 py-1.5 text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-900">{user.shopName}</span>
              <span className="text-slate-400">|</span>
              <span>
                {language === "hi" ? "उपलब्ध क्रेडिट:" : "Available Credit:"}{" "}
                <strong className={user.creditAvailable < 5000 ? "text-red-600" : "text-emerald-700"}>
                  ₹{(user.creditAvailable || 0).toLocaleString()}
                </strong>
                {" "}({language === "hi" ? "सीमा" : "Limit"}: ₹{(user.creditLimit || 0).toLocaleString()})
              </span>
            </div>
            {user.creditAvailable < 5000 && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {language === "hi" ? "क्रेडिट सीमा समाप्त होने वाली है" : "Near Credit Limit"}
              </span>
            )}
          </div>
        )}

        {/* Mobile Tab Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white py-1.5 text-xs font-medium">
          <button
            onClick={() => setCurrentTab("catalogue")}
            className={`px-3 py-1 rounded-full ${
              currentTab === "catalogue" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            {language === "hi" ? "कैटलॉग" : "Catalogue"}
          </button>
          <button
            onClick={() => setCurrentTab("orders")}
            className={`px-3 py-1 rounded-full ${
              currentTab === "orders" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            {language === "hi" ? "ऑर्डर्स" : "Orders"}
          </button>
          {isOrderDesk && (
            <>
              <button
                onClick={() => setCurrentTab("order_desk")}
                className={`px-3 py-1 rounded-full ${
                  currentTab === "order_desk" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                {language === "hi" ? "ऑर्डर डेस्क" : "Order Desk"}
              </button>
              <button
                onClick={() => setCurrentTab("inactive_retailers")}
                className={`px-3 py-1 rounded-full ${
                  currentTab === "inactive_retailers" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                14d Alert
              </button>
            </>
          )}
        </div>
      </header>

      {/* Role Switcher Dialog for Evaluator/Reviewer */}
      <Dialog open={isSwitchOpen} onOpenChange={setIsSwitchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Switch Demo User Persona
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select any role to test the application from their perspective. No password or OTP needed for reviewer evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 py-1">
            {allUsers.map((u) => {
              const isSelected = user?.phone === u.phone
              return (
                <div
                  key={u.id}
                  onClick={() => handleSwitchUser(u.phone)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {u.shopName || u.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          u.role === "RETAILER"
                            ? "bg-emerald-100 text-emerald-800"
                            : u.role === "ORDER_DESK"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "SALESMAN"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: {u.phone} {u.name ? `(${u.name})` : ""}
                    </p>
                    {u.role === "RETAILER" && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Credit Limit: ₹{u.creditLimit.toLocaleString()} | Used: ₹{u.creditUsed.toLocaleString()}
                        {u.creditLimit - u.creditUsed < 5000 && (
                          <span className="text-red-600 font-bold ml-1">(Near Limit!)</span>
                        )}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 text-xs h-8"
                  >
                    {isSelected ? "Active" : "Switch"}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

