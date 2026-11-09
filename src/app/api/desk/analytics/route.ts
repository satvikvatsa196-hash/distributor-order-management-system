import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === "RETAILER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // 1. Order counts by status
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
      },
    })

    const totalOrders = orders.length
    const pendingOrders = orders.filter((o) => o.status === "PENDING").length
    const creditHoldOrders = orders.filter((o) => o.status === "CREDIT_HOLD").length
    const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED").length
    const dispatchedOrders = orders.filter((o) => o.status === "DISPATCHED").length

    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0)

    // 2. Identify retailers with NO order in the last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const allRetailers = await prisma.user.findMany({
      where: { role: "RETAILER" },
      include: {
        assignedSalesman: {
          select: { name: true, phone: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, total: true, orderNumber: true },
        },
      },
    })

    const inactiveRetailers = allRetailers
      .map((r) => {
        const lastOrder = r.orders[0]
        const lastOrderDate = lastOrder ? lastOrder.createdAt : null
        const daysSinceLastOrder = lastOrderDate
          ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        return {
          id: r.id,
          name: r.name,
          shopName: r.shopName,
          phone: r.phone,
          address: r.address,
          creditLimit: r.creditLimit,
          creditUsed: r.creditUsed,
          salesmanName: r.assignedSalesman?.name || "Unassigned",
          salesmanPhone: r.assignedSalesman?.phone || "",
          lastOrderDate,
          lastOrderAmount: lastOrder?.total || 0,
          daysSinceLastOrder,
          isInactive: daysSinceLastOrder >= 14,
        }
      })
      .filter((r) => r.isInactive)
      .sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder)

    // 3. Stock alert: items with low stock or out of stock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: 20 },
      },
      select: {
        id: true,
        skuCode: true,
        name: true,
        stock: true,
        unit: true,
      },
      orderBy: { stock: "asc" },
      take: 5,
    })

    return NextResponse.json({
      summary: {
        totalOrders,
        pendingOrders,
        creditHoldOrders,
        confirmedOrders,
        dispatchedOrders,
        totalRevenue,
        inactiveRetailerCount: inactiveRetailers.length,
      },
      inactiveRetailers,
      lowStockProducts,
    })
  } catch (error) {
    console.error("Error generating desk analytics:", error)
    return NextResponse.json({ error: "Failed to load desk analytics" }, { status: 500 })
  }
}
