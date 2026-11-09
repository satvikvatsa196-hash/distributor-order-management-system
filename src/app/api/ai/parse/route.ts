import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { parseTextOrder, ProductInfo, AliasInfo } from "@/lib/ai-parser"

export async function POST(req: NextRequest) {
  try {
    const { text, retailerId } = await req.json()
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Please provide order text" }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    const targetRetailerId = retailerId || currentUser?.id

    // Fetch products
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        skuCode: true,
        name: true,
        nameHindi: true,
        dealerPrice: true,
        retailerPrice: true,
        stock: true,
        unit: true,
      },
    })

    const products: ProductInfo[] = dbProducts.map((p) => ({
      id: p.id,
      skuCode: p.skuCode,
      name: p.name,
      nameHindi: p.nameHindi ?? undefined,
      dealerPrice: p.dealerPrice,
      retailerPrice: p.retailerPrice,
      stock: p.stock,
      unit: p.unit,
    }))

    // Fetch aliases (both global and retailer-specific)
    const dbAliases = await prisma.skuAlias.findMany({
      where: {
        OR: [
          { retailerId: null },
          ...(targetRetailerId ? [{ retailerId: targetRetailerId }] : []),
        ],
      },
      select: {
        alias: true,
        productId: true,
      },
    })

    const aliases: AliasInfo[] = dbAliases.map((a) => ({
      alias: a.alias,
      productId: a.productId,
    }))

    // Parse the order text using AI parser with local fallback
    const result = await parseTextOrder(text, products, aliases)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in AI order parse:", error)
    return NextResponse.json(
      { error: error.message || "Failed to parse order text" },
      { status: 500 }
    )
  }
}
