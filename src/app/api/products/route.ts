import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")?.trim() || ""
    const category = searchParams.get("category") || ""
    const inStockOnly = searchParams.get("inStock") === "true"

    const user = await getCurrentUser()
    const isRetailer = user?.role === "RETAILER"

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (inStockOnly) {
      where.stock = { gt: 0 }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameHindi: { contains: search } },
        { skuCode: { contains: search } },
        { category: { contains: search } },
        {
          aliases: {
            some: {
              alias: { contains: search.toLowerCase() },
            },
          },
        },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        schemes: {
          where: { isActive: true },
        },
      },
      orderBy: [
        { stock: "desc" },
        { name: "asc" },
      ],
    })

    // Categories list for tabs
    const categories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    })

    return NextResponse.json({
      products,
      categories: categories.map((c) => c.category),
      user: user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
            shopName: user.shopName,
            creditLimit: user.creditLimit,
            creditUsed: user.creditUsed,
            creditAvailable: Math.max(0, user.creditLimit - user.creditUsed),
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
