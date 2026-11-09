import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            assignedSalesman: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                schemes: { where: { isActive: true } },
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Access control: Retailers can only view their own order
    if (user.role === "RETAILER" && order.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Order Desk or Admin can update status
    if (user.role === "RETAILER") {
      return NextResponse.json({ error: "Only Order Desk can modify orders" }, { status: 403 })
    }

    const body = await req.json()
    const { status, notes, creditOverride } = body

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { user: true, items: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

