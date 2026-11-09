"use client"

import React, { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Sparkles,
  Mic,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  BookmarkCheck,
} from "lucide-react"

interface AIOrderModalProps {
  isOpen: boolean
  onClose: () => void
  language: "en" | "hi"
}

export function AIOrderModal({ isOpen, onClose, language }: AIOrderModalProps) {
  const { addItem, clearCart } = useCart()
  const { toast } = useToast()

  const SAMPLE_ORDERS = [
    {
      label: "Prompt from Brief",
      text: "bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti.",
    },
    {
      label: "Hindi Voice Note",
      text: "अरे भैया 10 पेटी ग्लूकोज बिस्किट भेज देना और 5 पेटी सर्फ 1 किलो वाला",
    },
    {
      label: "Ambiguous Units Test",
      text: "bhaiya 10 packet biscuit, 3 peti washing powder, 2 dabba chai patti 250g",
    },
  ]

  const [inputText, setInputText] = useState(SAMPLE_ORDERS[0].text)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedResult, setParsedResult] = useState<any | null>(null)
  const [editingItems, setEditingItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"text" | "voice" | "photo">("text")
  const [isRecording, setIsRecording] = useState(false)

  const handleParse = async () => {
    if (!inputText.trim()) return

    try {
      setIsParsing(true)
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      })

      if (res.ok) {
        const data = await res.json()
        setParsedResult(data)
        setEditingItems(data.items || [])
      } else {
        toast({
          title: "Failed to parse",
          description: "Could not interpret message. Please try again.",
          variant: "error",
        })
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Something went wrong while communicating with AI parser.",
        variant: "error",
      })
    } finally {
      setIsParsing(false)
    }
  }

  // Swap matched SKU with an alternative SKU suggestion
  const handleSwapAlternative = async (index: number, alt: any) => {
    const updated = [...editingItems]
    const originalText = updated[index].originalText

    updated[index] = {
      ...updated[index],
      matchedProductId: alt.productId,
      matchedProductName: alt.name,
      matchedSkuCode: alt.skuCode,
      confidence: 0.95, // Manually confirmed
      status: "matched",
    }
    setEditingItems(updated)

    // Automatically save this desk/retailer correction as an alias!
    try {
      await fetch("/api/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: originalText,
          productId: alt.productId,
        }),
      })
      toast({
        title: "Alias Learned!",
        description: `Future orders of "${originalText}" will now automatically map to "${alt.name}".`,
        variant: "success",
      })
    } catch (e) {}
  }

  const handleUpdateUnit = (index: number, newUnit: string) => {
    const updated = [...editingItems]
    updated[index].unit = newUnit
    updated[index].needsUnitClarification = false
    setEditingItems(updated)
  }

  const handleUpdateQuantity = (index: number, newQty: number) => {
    const updated = [...editingItems]
    updated[index].quantity = Math.max(1, newQty)
    setEditingItems(updated)
  }

  const handleConfirmAndAddToCart = () => {
    const validItems = editingItems.filter((i) => i.matchedProductId)

    if (validItems.length === 0) {
      toast({
        title: "No valid items",
        description: "Please match at least one product before proceeding.",
        variant: "error",
      })
      return
    }

    // Add each confirmed item to cart
    for (const item of validItems) {
      addItem(
        {
          id: item.matchedProductId,
          skuCode: item.matchedSkuCode,
          name: item.matchedProductName,
          retailerPrice: item.unitPrice,
          unit: item.unit,
          stock: 999, // Checked at checkout
        },
        item.quantity
      )
    }

    toast({
      title: "Added to Cart!",
      description: `${validItems.length} items added with applicable schemes.`,
      variant: "success",
    })

    onClose()
  }

  // Simulate audio recording for Hindi voice note
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setInputText("अरे भैया 5 पेटी ग्लूकोज बिस्किट और 2 पेटी वाशिंग पाउडर 1 किलो भेज दो")
      toast({
        title: "Voice Transcribed",
        description: "Hindi voice note transcribed successfully.",
        variant: "success",
      })
    } else {
      setIsRecording(true)
      toast({
        title: "Listening...",
        description: "Speak in Hindi or Hinglish...",
      })
      setTimeout(() => {
        setIsRecording(false)
        setInputText("अरे भैया 5 पेटी ग्लूकोज बिस्किट और 2 पेटी वाशिंग पाउडर 1 किलो भेज दो")
      }, 2500)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {language === "hi" ? "AI ऑर्डर कैप्चर" : "AI Natural Language Order Capture"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {language === "hi"
              ? "व्हाट्सएप चैट, पर्ची की फोटो, या हिंदी वॉइस नोट को तुरंत ऑर्डर में बदलें।"
              : "Paste WhatsApp messages, voice note transcripts, or handwritten list text."}
          </DialogDescription>
        </DialogHeader>

        {/* Input Mode Selector */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("text")}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "text"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            WhatsApp Text
          </button>
          <button
            onClick={() => {
              setActiveTab("voice")
              toggleRecording()
            }}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "voice"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-red-500" />
            Hindi Voice Note
          </button>
          <button
            onClick={() => {
              setActiveTab("photo")
              setInputText("10 peti glucose biscuit 75g\n2 peti detergent powder 1kg\n1 peti chai patti 250g")
            }}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "photo"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            Photo of List (OCR)
          </button>
        </div>

        {/* Sample Templates */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Quick Sample Prompts from Jabalpur Kiranas:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_ORDERS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(sample.text)}
                className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-2.5 py-1 rounded-md transition text-slate-700 text-left font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans"
            placeholder="Type or paste order here in Hindi/Hinglish (e.g. bhaiya 5 peti biscuit chhota...)"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <BookmarkCheck className="w-3 h-3 text-emerald-600" />
              Uses retailer-specific colloquial aliases + Google Gemini fallback
            </span>

            <Button
              onClick={handleParse}
              loading={isParsing}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 font-semibold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {isParsing ? "Interpreting..." : "Parse & Match SKUs"}
            </Button>
          </div>
        </div>

        {/* Parse Results Review */}
        {editingItems.length > 0 && (
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Parsed Items Review ({editingItems.length} lines detected)
              </h4>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Confidence: {Math.round((parsedResult?.overallConfidence || 0.88) * 100)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              "No order is placed until a person confirms it. Corrections become aliases for this retailer."
            </p>

            <div className="space-y-2.5">
              {editingItems.map((item, idx) => {
                const confPercent = Math.round((item.confidence || 0) * 100)
                const isHighConf = confPercent >= 80

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    {/* Top Row: Original Words vs Matched SKU */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Original text: </span>
                        <span className="text-xs font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          "{item.originalText}"
                        </span>
                      </div>

                      {/* Confidence Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 w-fit ${
                          isHighConf
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {confPercent}% Match
                      </span>
                    </div>

                    {/* Matched Product & Qty */}
                    <div className="bg-white p-2.5 rounded-md border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {item.matchedProductName || (
                            <span className="text-red-500">Unmatched Item</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.matchedSkuCode} • ₹{item.unitPrice?.toFixed(2)}/{item.unit}
                        </div>
                      </div>

                      {/* Quantity & Unit controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border border-slate-300 rounded px-2 py-1">
                          <span className="text-xs text-slate-500">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(idx, parseInt(e.target.value) || 1)
                            }
                            className="w-12 text-center text-xs font-bold focus:outline-none"
                          />
                        </div>

                        {/* Unit clarification badge */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateUnit(idx, "case")}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              item.unit === "case"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            Case
                          </button>
                          <button
                            onClick={() => handleUpdateUnit(idx, "piece")}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              item.unit === "piece"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            Piece
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unit Ambiguity Warning */}
                    {item.needsUnitClarification && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-md">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Unit was unclear in message ("{item.originalText}"). Please confirm if you meant <strong>Case</strong> or <strong>Piece</strong>.
                        </span>
                      </div>
                    )}

                    {/* Alternative SKU Suggestions */}
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Did you mean one of these?
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.alternatives.map((alt: any, altIdx: number) => (
                            <button
                              key={altIdx}
                              onClick={() => handleSwapAlternative(idx, alt)}
                              className="text-[11px] bg-white hover:bg-blue-50 hover:border-blue-400 border border-slate-200 px-2 py-1 rounded text-slate-700 transition flex items-center gap-1"
                            >
                              <span>{alt.name}</span>
                              <span className="text-slate-400 font-mono">({alt.skuCode})</span>
                              <ArrowRight className="w-3 h-3 text-blue-500 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {editingItems.length > 0 && (
            <Button
              onClick={handleConfirmAndAddToCart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 shadow-xs"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Confirm {editingItems.length} Items & Add to Cart
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

