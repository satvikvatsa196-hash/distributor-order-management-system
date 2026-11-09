import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const res = NextResponse.json({ success: true, user })
    res.cookies.set("demo_user_phone", user.phone, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    })
    return res
  } catch (error) {
    return NextResponse.json({ error: "Failed to switch user" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { role: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        shopName: true,
        creditLimit: true,
        creditUsed: true,
      },
    })
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

