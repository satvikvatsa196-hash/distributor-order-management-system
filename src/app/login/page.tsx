"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Store, ShieldCheck, ArrowRight, UserCheck, Smartphone, Lock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)

  const DEMO_ACCOUNTS = [
    {
      role: "RETAILER",
      name: "Sharma General Store (Ramesh Sharma)",
      phone: "9999999701",
      badge: "Healthy Credit (₹62.5k)",
    },
    {
      role: "RETAILER",
      name: "Gupta Kirana (Mahesh Gupta)",
      phone: "9999999702",
      badge: "Credit Hold Test (₹1.8k left)",
    },
    {
      role: "ORDER_DESK",
      name: "Priya Sharma (Office Order Desk)",
      phone: "9999999901",
      badge: "Approvals & Tally Export",
    },
    {
      role: "SALESMAN",
      name: "Vikram Singh (Field Sales)",
      phone: "9999999801",
      badge: "Salesman Visit Mode",
    },
    {
      role: "ADMIN",
      name: "Rajesh Kumar (Owner-Director)",
      phone: "9999999999",
      badge: "Director Master Control",
    },
  ]

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "error",
      })
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep("otp")
      setOtp("123456") // Pre-fill mock OTP for convenience
      toast({
        title: "OTP Dispatched",
        description: "Use mock OTP: 123456 to verify.",
        variant: "info",
      })
    }, 600)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      if (res.ok) {
        toast({
          title: "Sign In Successful",
          description: "Welcome to Company A Jabalpur Portal.",
          variant: "success",
        })
        router.push("/")
        router.refresh()
      } else {
        toast({
          title: "Login Failed",
          description: "User not found or invalid credentials.",
          variant: "error",
        })
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Network error during login.",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (accountPhone: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: accountPhone }),
      })

      if (res.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (e) {
      alert("Failed to switch account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md mx-auto">
          CA
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-900">
          Company A — Jabalpur Distribution Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Serving 1,800 Kirana Stores across packaged food & home care
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-sm sm:rounded-xl sm:px-8 border border-slate-200 space-y-5">
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Registered Mobile Number
                </label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98XXXXXXXX"
                    className="pl-11 w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We will send a 6-digit one-time password (OTP) via SMS.
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-xs shadow-xs"
              >
                Send OTP <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Enter Verification OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Change Phone
                  </button>
                </div>
                <div className="mt-1.5 relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-lg tracking-widest p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    required
                  />
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  Demo Mode: Enter mock OTP <strong>123456</strong>
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs shadow-xs"
              >
                Verify & Log In
              </Button>
            </form>
          )}

          {/* Quick Demo Personas Selector */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              1-Click Reviewer Demo Logins:
            </span>

            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  onClick={() => handleQuickLogin(acc.phone)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {acc.role} • Phone: {acc.phone}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-2xs">
                    {acc.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Client Brief Specification • Company A Jabalpur • ₹85-100 Cr/yr FMCG Distribution
        </p>
      </div>
    </div>
  )
}
