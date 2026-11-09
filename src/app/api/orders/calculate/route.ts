import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateSchemes, CartItem } from "@/lib/scheme-engine"

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json()
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        totalDiscount: 0,
        freeGoodsSummary: [],
        gstAmount: 0,
        total: 0,
      })
    }

    // Fetch live product and scheme data for accurate calculations
    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        schemes: {
          where: { isActive: true },
        },
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    const cartItems: CartItem[] = []
    let totalGst = 0

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue

      const qty = Math.max(0, parseInt(item.quantity) || 0)
      if (qty <= 0) continue

      const unitPrice = item.unitPrice ?? product.retailerPrice

      cartItems.push({
        productId: product.id,
        skuCode: product.skuCode,
        name: product.name,
        quantity: qty,
        unitPrice,
        schemes: product.schemes.map((s) => ({
          id: s.id,
          type: s.type as any,
          minQty: s.minQty,
          freeQty: s.freeQty,
          discountPercent: s.discountPercent,
          description: s.description,
        })),
      })
    }

    const result = calculateSchemes(cartItems)

    // Calculate GST: In the FMCG model, prices may be GST inclusive or exclusive
    // If inclusive, GST is backed out: GST = Total * (rate / (100 + rate))
    // We show GST clearly as mandated by brief: "Prices must show clearly whether GST is included."
    const gstRate = 18 // standard FMCG GST
    const gstAmount = Math.round(((result.total * gstRate) / (100 + gstRate)) * 100) / 100

    return NextResponse.json({
      ...result,
      gstRate,
      gstInclusive: true,
      gstAmount,
    })
  } catch (error) {
    console.error("Error calculating schemes:", error)
    return NextResponse.json({ error: "Failed to calculate schemes" }, { status: 500 })
  }
}

