import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { calculateSchemes, CartItem } from "@/lib/scheme-engine"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}

    // If Retailer, restrict to own orders
    if (user.role === "RETAILER") {
      where.userId = user.id
    } else if (user.role === "SALESMAN") {
      // Salesman sees orders of assigned retailers
      where.user = {
        assignedSalesmanId: user.id,
      }
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { shopName: { contains: search } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            shopName: true,
            address: true,
            creditLimit: true,
            creditUsed: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                skuCode: true,
                unit: true,
                stock: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders, userRole: user.role })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      items,
      notes,
      source = "APP",
      aiConfidence,
      aiRawInput,
      targetRetailerId,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    // Determine target retailer
    let orderUser = currentUser
    if ((currentUser.role === "ORDER_DESK" || currentUser.role === "ADMIN" || currentUser.role === "SALESMAN") && targetRetailerId) {
      const selected = await prisma.user.findUnique({
        where: { id: targetRetailerId },
      })
      if (selected) orderUser = selected
    }

    // Fetch products
    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        schemes: { where: { isActive: true } },
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Validate quantities & stock
    const cartItems: CartItem[] = []
    const stockErrors: string[] = []

    for (const item of items) {
      const p = productMap.get(item.productId)
      if (!p) {
        return NextResponse.json({ error: `Product ID ${item.productId} not found` }, { status: 400 })
      }

      const qty = parseInt(item.quantity) || 0
      if (qty <= 0) continue

      if (p.stock < qty) {
        stockErrors.push(`${p.name} (Stock: ${p.stock} cases, requested: ${qty})`)
      }

      cartItems.push({
        productId: p.id,
        skuCode: p.skuCode,
        name: p.name,
        quantity: qty,
        unitPrice: item.unitPrice ?? p.retailerPrice,
        schemes: p.schemes.map((s) => ({
          id: s.id,
          type: s.type as any,
          minQty: s.minQty,
          freeQty: s.freeQty,
          discountPercent: s.discountPercent,
          description: s.description,
        })),
      })
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Insufficient stock for: " + stockErrors.join(", "),
          stockErrors,
        },
        { status: 400 }
      )
    }

    // Run scheme engine calculation
    const calc = calculateSchemes(cartItems)
    const gstRate = 18
    const gstAmount = Math.round(((calc.total * gstRate) / (100 + gstRate)) * 100) / 100

    // Credit limit check
    const currentUsed = orderUser.creditUsed
    const creditLimit = orderUser.creditLimit
    const newCreditUsed = currentUsed + calc.total
    const isCreditExceeded = newCreditUsed > creditLimit

    // If source is AI, it can stay PENDING until confirmed by desk or retailer
    // If credit limit exceeded, it goes to CREDIT_HOLD
    let status = "CONFIRMED"
    if (isCreditExceeded) {
      status = "CREDIT_HOLD"
    } else if (source.startsWith("AI_") && (!aiConfidence || aiConfidence < 0.9)) {
      status = "PENDING"
    }

    // Generate Order Number
    const count = await prisma.order.count()
    const year = new Date().getFullYear()
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(4, "0")}`

    // Create Order and Items in Transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: orderUser.id,
          status,
          subtotal: calc.subtotal,
          discount: calc.totalDiscount,
          freeGoods: JSON.stringify(calc.freeGoodsSummary),
          total: calc.total,
          gstAmount,
          notes,
          source,
          aiConfidence: aiConfidence ?? null,
          aiRawInput: aiRawInput ?? null,
          items: {
            create: calc.items.map((res) => {
              const original = items.find((i: any) => i.productId === res.productId)
              return {
                productId: res.productId,
                quantity: res.quantity,
                unitPrice: res.unitPrice,
                total: res.lineTotal - res.discount,
                isFreeGood: false,
                originalText: original?.originalText || null,
                confidence: original?.confidence || null,
                alternatives: original?.alternatives ? JSON.stringify(original.alternatives) : null,
              }
            }),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          user: true,
        },
      })

      // Add free goods as order items with unitPrice = 0, isFreeGood = true
      for (const fg of calc.freeGoodsSummary) {
        // find matching product for the free good
        const matchedItem = calc.items.find((i) => i.name === fg.name && i.freeGoods > 0)
        if (matchedItem) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: matchedItem.productId,
              quantity: fg.quantity,
              unitPrice: 0,
              total: 0,
              isFreeGood: true,
              originalText: `Scheme Free Good: ${fg.name}`,
            },
          })
        }
      }

      // Deduct product stock
      for (const item of calc.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity + (item.freeGoods || 0),
            },
          },
        })
      }

      // Update user creditUsed
      await tx.user.update({
        where: { id: orderUser.id },
        data: {
          creditUsed: newCreditUsed,
        },
      })

      return newOrder
    })

    return NextResponse.json({
      success: true,
      order,
      isCreditExceeded,
      message: isCreditExceeded
        ? "Order placed under CREDIT HOLD due to credit limit exceeded."
        : "Order placed successfully!",
    })
  } catch (error: any) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 })
  }
}

