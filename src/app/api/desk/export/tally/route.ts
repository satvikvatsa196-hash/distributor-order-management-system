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
    const format = searchParams.get("format") || "xml" // xml, csv, or json
    const orderId = searchParams.get("orderId")

    const where: any = {
      status: { in: ["CONFIRMED", "DISPATCHED", "PENDING"] },
    }
    if (orderId) {
      where.id = orderId
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (format === "json") {
      return NextResponse.json({ orders })
    }

    if (format === "csv") {
      const headers = [
        "Voucher No",
        "Date",
        "Party Name",
        "Phone",
        "Item Name",
        "SKU Code",
        "Quantity",
        "Rate",
        "Amount",
        "Is Free Good",
        "Status",
      ]

      const rows: string[] = [headers.join(",")]

      for (const order of orders) {
        const dateStr = new Date(order.createdAt).toISOString().split("T")[0]
        const partyName = `"${order.user.shopName || order.user.name}"`
        for (const item of order.items) {
          rows.push([
            order.orderNumber,
            dateStr,
            partyName,
            order.user.phone,
            `"${item.product.name}"`,
            item.product.skuCode,
            item.quantity,
            item.unitPrice.toFixed(2),
            item.total.toFixed(2),
            item.isFreeGood ? "YES" : "NO",
            order.status,
          ].join(","))
        }
      }

      return new NextResponse(rows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Tally_Sales_Orders_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Default: Standard Tally Prime / ERP 9 XML format
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Company A - Jabalpur</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
`

    for (const order of orders) {
      const d = new Date(order.createdAt)
      const tallyDate = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
      const party = order.user.shopName || order.user.name

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales Order" ACTION="Create">
            <DATE>${tallyDate}</DATE>
            <VOUCHERTYPENAME>Sales Order</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${order.orderNumber}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
            <NARRATION>Order placed via Jabalpur Portal (${order.source}). Ref: ${order.orderNumber}. ${order.notes || ""}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${party}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${order.total.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
`

      for (const item of order.items) {
        xml += `            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${item.product.name}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <RATE>${item.unitPrice.toFixed(2)}/case</RATE>
              <AMOUNT>${item.total.toFixed(2)}</AMOUNT>
              <ACTUALQTY>${item.quantity} case</ACTUALQTY>
              <BILLEDQTY>${item.isFreeGood ? 0 : item.quantity} case</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Jabalpur Central Godown</GODOWNNAME>
                <AMOUNT>${item.total.toFixed(2)}</AMOUNT>
                <ACTUALQTY>${item.quantity} case</ACTUALQTY>
                <BILLEDQTY>${item.isFreeGood ? 0 : item.quantity} case</BILLEDQTY>
              </BATCHALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>
`
      }

      xml += `          </VOUCHER>
        </TALLYMESSAGE>
`
    }

    xml += `      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="Tally_Import_${new Date().toISOString().split("T")[0]}.xml"`,
      },
    })
  } catch (error) {
    console.error("Error generating Tally export:", error)
    return NextResponse.json({ error: "Failed to generate Tally export" }, { status: 500 })
  }
}
