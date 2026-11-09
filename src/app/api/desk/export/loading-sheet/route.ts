import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === "RETAILER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "json" // json or csv

    // Get orders ready for dispatch
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["CONFIRMED", "DISPATCHED"] },
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // 1. Group items by SKU for warehouse truck loading
    const skuTotals: Record<
      string,
      {
        skuCode: string
        name: string
        totalCases: number
        billedCases: number
        freeCases: number
      }
    > = {}

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId
        if (!skuTotals[key]) {
          skuTotals[key] = {
            skuCode: item.product.skuCode,
            name: item.product.name,
            totalCases: 0,
            billedCases: 0,
            freeCases: 0,
          }
        }
        skuTotals[key].totalCases += item.quantity
        if (item.isFreeGood) {
          skuTotals[key].freeCases += item.quantity
        } else {
          skuTotals[key].billedCases += item.quantity
        }
      }
    }

    const aggregatedSkus = Object.values(skuTotals).sort((a, b) => b.totalCases - a.totalCases)

    // 2. Deliveries list for van driver route
    const deliveryDrops = orders.map((o, idx) => ({
      dropSequence: idx + 1,
      orderNumber: o.orderNumber,
      shopName: o.user.shopName || o.user.name,
      phone: o.user.phone,
      address: o.user.address || "Jabalpur Central",
      totalCases: o.items.reduce((sum, i) => sum + i.quantity, 0),
      orderTotal: o.total,
      itemCount: o.items.length,
      status: o.status,
    }))

    if (format === "csv") {
      let csv = "=== WAREHOUSE VAN LOADING SUMMARY ===\n"
      csv += "SKU Code,Product Name,Total Cases to Load,Billed Cases,Free Scheme Cases\n"
      for (const sku of aggregatedSkus) {
        csv += `${sku.skuCode},"${sku.name}",${sku.totalCases},${sku.billedCases},${sku.freeCases}\n`
      }
      csv += "\n=== RETAIL STORE DELIVERY DROPS ===\n"
      csv += "Drop #,Order No,Shop Name,Phone,Address,Cases,Order Amount (Rs)\n"
      for (const drop of deliveryDrops) {
        csv += `${drop.dropSequence},${drop.orderNumber},"${drop.shopName}",${drop.phone},"${drop.address}",${drop.totalCases},${drop.orderTotal.toFixed(2)}\n`
      }

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Van_Loading_Sheet_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      date: new Date().toISOString().split("T")[0],
      totalOrders: orders.length,
      totalCasesToLoad: aggregatedSkus.reduce((sum, s) => sum + s.totalCases, 0),
      warehouseSummary: aggregatedSkus,
      deliveryDrops,
    })
  } catch (error) {
    console.error("Error generating van loading sheet:", error)
    return NextResponse.json({ error: "Failed to generate loading sheet" }, { status: 500 })
  }
}

