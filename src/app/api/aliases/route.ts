import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { alias, productId, retailerId } = await req.json()
    if (!alias || !productId) {
      return NextResponse.json({ error: "Alias and Product ID are required" }, { status: 400 })
    }

    const cleanAlias = alias.trim().toLowerCase()

    // Upsert the alias for the specific retailer or globally
    const savedAlias = await prisma.skuAlias.upsert({
      where: {
        alias_retailerId: {
          alias: cleanAlias,
          retailerId: retailerId || null,
        },
      },
      update: {
        productId,
      },
      create: {
        alias: cleanAlias,
        productId,
        retailerId: retailerId || null,
        language: "hi",
      },
      include: {
        product: {
          select: { name: true, skuCode: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Alias "${cleanAlias}" mapped to "${savedAlias.product.name}"`,
      alias: savedAlias,
    })
  } catch (error: any) {
    console.error("Error creating alias:", error)
    return NextResponse.json({ error: error.message || "Failed to create alias" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const retailerId = searchParams.get("retailerId")

    const aliases = await prisma.skuAlias.findMany({
      where: retailerId ? { OR: [{ retailerId }, { retailerId: null }] } : undefined,
      include: {
        product: { select: { name: true, skuCode: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ aliases })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch aliases" }, { status: 500 })
  }
}

