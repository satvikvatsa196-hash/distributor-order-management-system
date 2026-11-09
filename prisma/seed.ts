import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in correct order (respecting foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.skuAlias.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // ─── USERS ───────────────────────────────────────────────────────────

  const admin = await prisma.user.create({
    data: {
      phone: "9999999999",
      name: "Rajesh Kumar",
      role: "ADMIN",
      address: "12, Napier Town, Jabalpur, MP 482001",
    },
  });

  const [orderDesk1, orderDesk2] = await Promise.all([
    prisma.user.create({
      data: {
        phone: "9999999901",
        name: "Priya Sharma",
        role: "ORDER_DESK",
        address: "Office - Napier Town, Jabalpur",
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999902",
        name: "Amit Verma",
        role: "ORDER_DESK",
        address: "Office - Napier Town, Jabalpur",
      },
    }),
  ]);

  const [salesman1, salesman2, salesman3] = await Promise.all([
    prisma.user.create({
      data: {
        phone: "9999999801",
        name: "Vikram Singh",
        role: "SALESMAN",
        address: "Madan Mahal, Jabalpur",
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999802",
        name: "Deepak Yadav",
        role: "SALESMAN",
        address: "Wright Town, Jabalpur",
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999803",
        name: "Sunil Patel",
        role: "SALESMAN",
        address: "Gorakhpur, Jabalpur",
      },
    }),
  ]);

  const retailers = await Promise.all([
    prisma.user.create({
      data: {
        phone: "9999999701",
        name: "Ramesh Sharma",
        role: "RETAILER",
        shopName: "Sharma General Store",
        address: "23, Main Road, Madan Mahal, Jabalpur",
        creditLimit: 75000,
        creditUsed: 12500,
        assignedSalesmanId: salesman1.id,
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999702",
        name: "Mahesh Gupta",
        role: "RETAILER",
        shopName: "Gupta Kirana",
        address: "45, Station Road, Wright Town, Jabalpur",
        creditLimit: 50000,
        creditUsed: 48200,
        assignedSalesmanId: salesman2.id,
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999703",
        name: "Suresh Agrawal",
        role: "RETAILER",
        shopName: "Agrawal Provision Store",
        address: "78, Civil Lines, Jabalpur",
        creditLimit: 100000,
        creditUsed: 22000,
        assignedSalesmanId: salesman1.id,
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999704",
        name: "Dinesh Sahu",
        role: "RETAILER",
        shopName: "Sahu Grocery Mart",
        address: "12, Gorakhpur Market, Jabalpur",
        creditLimit: 40000,
        creditUsed: 5600,
        assignedSalesmanId: salesman3.id,
      },
    }),
    prisma.user.create({
      data: {
        phone: "9999999705",
        name: "Kamlesh Tiwari",
        role: "RETAILER",
        shopName: "Tiwari Kirana & General Store",
        address: "56, Adhartal, Jabalpur",
        creditLimit: 60000,
        creditUsed: 31000,
        assignedSalesmanId: salesman2.id,
      },
    }),
  ]);

  console.log(
    `👥 Created ${1 + 2 + 3 + retailers.length} users (1 admin, 2 order desk, 3 salesmen, ${retailers.length} retailers)`
  );

  // ─── PRODUCTS ────────────────────────────────────────────────────────

  const products = await prisma.$transaction([
    // Brand 1: Shakti (Biscuits & Snacks)
    prisma.product.create({
      data: {
        skuCode: "SKU-BS-075",
        name: "Shakti Glucose Biscuit 75g",
        nameHindi: "शक्ति ग्लूकोज बिस्किट 75 ग्राम",
        category: "Biscuits",
        mrp: 10.0,
        dealerPrice: 8.1,
        retailerPrice: 8.85,
        unit: "case",
        unitsPerCase: 96,
        gstRate: 18,
        gstInclusive: true,
        stock: 340,
        lowStockThreshold: 20,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-BS-150",
        name: "Shakti Glucose Biscuit 150g",
        nameHindi: "शक्ति ग्लूकोज बिस्किट 150 ग्राम",
        category: "Biscuits",
        mrp: 20.0,
        dealerPrice: 16.2,
        retailerPrice: 17.7,
        unit: "case",
        unitsPerCase: 48,
        gstRate: 18,
        gstInclusive: true,
        stock: 180,
        lowStockThreshold: 15,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-CB-100",
        name: "Shakti Cream Biscuit Chocolate 100g",
        nameHindi: "शक्ति क्रीम बिस्किट चॉकलेट 100 ग्राम",
        category: "Biscuits",
        mrp: 25.0,
        dealerPrice: 20.0,
        retailerPrice: 21.8,
        unit: "case",
        unitsPerCase: 60,
        gstRate: 18,
        gstInclusive: true,
        stock: 95,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-CK-200",
        name: "Shakti Butter Cookies 200g",
        nameHindi: "शक्ति बटर कुकीज 200 ग्राम",
        category: "Biscuits",
        mrp: 45.0,
        dealerPrice: 36.0,
        retailerPrice: 39.25,
        unit: "case",
        unitsPerCase: 36,
        gstRate: 18,
        gstInclusive: true,
        stock: 62,
        lowStockThreshold: 8,
      },
    }),

    // Brand 2: Ujjwal (Detergents & Home Care)
    prisma.product.create({
      data: {
        skuCode: "SKU-DT-1KG",
        name: "Ujjwal Detergent Powder 1kg",
        nameHindi: "उज्ज्वल डिटर्जेंट पाउडर 1 किलो",
        category: "Detergent",
        mrp: 135.0,
        dealerPrice: 101.5,
        retailerPrice: 110.65,
        unit: "case",
        unitsPerCase: 20,
        gstRate: 18,
        gstInclusive: true,
        stock: 85,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-DT-500",
        name: "Ujjwal Detergent Powder 500g",
        nameHindi: "उज्ज्वल डिटर्जेंट पाउडर 500 ग्राम",
        category: "Detergent",
        mrp: 72.0,
        dealerPrice: 54.0,
        retailerPrice: 58.85,
        unit: "case",
        unitsPerCase: 30,
        gstRate: 18,
        gstInclusive: true,
        stock: 120,
        lowStockThreshold: 12,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-DB-250",
        name: "Ujjwal Detergent Bar 250g",
        nameHindi: "उज्ज्वल डिटर्जेंट बार 250 ग्राम",
        category: "Detergent",
        mrp: 18.0,
        dealerPrice: 13.5,
        retailerPrice: 14.7,
        unit: "case",
        unitsPerCase: 80,
        gstRate: 18,
        gstInclusive: true,
        stock: 200,
        lowStockThreshold: 20,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-DW-500",
        name: "Ujjwal Dishwash Liquid 500ml",
        nameHindi: "उज्ज्वल डिशवॉश लिक्विड 500 मिली",
        category: "Home Care",
        mrp: 85.0,
        dealerPrice: 64.0,
        retailerPrice: 69.75,
        unit: "case",
        unitsPerCase: 24,
        gstRate: 18,
        gstInclusive: true,
        stock: 55,
        lowStockThreshold: 8,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-FC-1LT",
        name: "Ujjwal Floor Cleaner 1L",
        nameHindi: "उज्ज्वल फ्लोर क्लीनर 1 लीटर",
        category: "Home Care",
        mrp: 110.0,
        dealerPrice: 82.5,
        retailerPrice: 89.9,
        unit: "case",
        unitsPerCase: 12,
        gstRate: 18,
        gstInclusive: true,
        stock: 42,
        lowStockThreshold: 5,
      },
    }),

    // Brand 3: Narmada (Tea)
    prisma.product.create({
      data: {
        skuCode: "SKU-TE-250",
        name: "Narmada Premium Tea Leaf 250g",
        nameHindi: "नर्मदा प्रीमियम चाय पत्ती 250 ग्राम",
        category: "Tea",
        mrp: 155.0,
        dealerPrice: 118.0,
        retailerPrice: 128.6,
        unit: "case",
        unitsPerCase: 40,
        gstRate: 5,
        gstInclusive: true,
        stock: 0,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-TE-500",
        name: "Narmada Premium Tea Leaf 500g",
        nameHindi: "नर्मदा प्रीमियम चाय पत्ती 500 ग्राम",
        category: "Tea",
        mrp: 290.0,
        dealerPrice: 220.0,
        retailerPrice: 239.8,
        unit: "case",
        unitsPerCase: 20,
        gstRate: 5,
        gstInclusive: true,
        stock: 75,
        lowStockThreshold: 8,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-TB-100",
        name: "Narmada Tea Bags 100 Pack",
        nameHindi: "नर्मदा टी बैग्स 100 पैक",
        category: "Tea",
        mrp: 180.0,
        dealerPrice: 136.0,
        retailerPrice: 148.25,
        unit: "case",
        unitsPerCase: 24,
        gstRate: 5,
        gstInclusive: true,
        stock: 38,
        lowStockThreshold: 5,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-TB-025",
        name: "Narmada Tea Bags 25 Pack",
        nameHindi: "नर्मदा टी बैग्स 25 पैक",
        category: "Tea",
        mrp: 50.0,
        dealerPrice: 37.5,
        retailerPrice: 40.9,
        unit: "case",
        unitsPerCase: 48,
        gstRate: 5,
        gstInclusive: true,
        stock: 110,
        lowStockThreshold: 12,
      },
    }),

    // Brand 4: Safal (Personal Care)
    prisma.product.create({
      data: {
        skuCode: "SKU-HS-200",
        name: "Safal Hand Soap 200g",
        nameHindi: "सफल हैंड सोप 200 ग्राम",
        category: "Personal Care",
        mrp: 35.0,
        dealerPrice: 26.5,
        retailerPrice: 28.9,
        unit: "case",
        unitsPerCase: 72,
        gstRate: 18,
        gstInclusive: true,
        stock: 160,
        lowStockThreshold: 15,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-TW-100",
        name: "Safal Toothpowder 100g",
        nameHindi: "सफल टूथ पाउडर 100 ग्राम",
        category: "Personal Care",
        mrp: 28.0,
        dealerPrice: 21.0,
        retailerPrice: 22.9,
        unit: "case",
        unitsPerCase: 60,
        gstRate: 18,
        gstInclusive: true,
        stock: 90,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        skuCode: "SKU-HC-100",
        name: "Safal Hair Oil Coconut 100ml",
        nameHindi: "सफल हेयर ऑइल नारियल 100 मिली",
        category: "Personal Care",
        mrp: 55.0,
        dealerPrice: 41.5,
        retailerPrice: 45.25,
        unit: "case",
        unitsPerCase: 48,
        gstRate: 18,
        gstInclusive: true,
        stock: 72,
        lowStockThreshold: 8,
      },
    }),
  ]);

  console.log(`📦 Created ${products.length} products`);

  // Map products by SKU for easy reference
  const productMap = new Map(products.map((p) => [p.skuCode, p]));

  // ─── SCHEMES ─────────────────────────────────────────────────────────

  const schemes = await prisma.$transaction([
    // Glucose biscuit 75g: Buy 10 cases get 1 free
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-BS-075")!.id,
        type: "BUY_X_GET_Y",
        minQty: 10,
        freeQty: 1,
        description: "Buy 10 cases get 1 case free",
      },
    }),
    // Detergent 1kg: 3% off on 5+ cases
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-DT-1KG")!.id,
        type: "SLAB_DISCOUNT",
        minQty: 5,
        discountPercent: 3,
        description: "3% discount on 5 or more cases",
      },
    }),
    // Glucose biscuit 150g: Buy 5 get 1 free
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-BS-150")!.id,
        type: "BUY_X_GET_Y",
        minQty: 5,
        freeQty: 1,
        description: "Buy 5 cases get 1 case free",
      },
    }),
    // Cream biscuit: 2% off on 3+ cases
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-CB-100")!.id,
        type: "SLAB_DISCOUNT",
        minQty: 3,
        discountPercent: 2,
        description: "2% discount on 3 or more cases",
      },
    }),
    // Detergent bar: Buy 8 cases get 1 free
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-DB-250")!.id,
        type: "BUY_X_GET_Y",
        minQty: 8,
        freeQty: 1,
        description: "Buy 8 cases get 1 case free",
      },
    }),
    // Tea 500g: 5% off on 3+ cases
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-TE-500")!.id,
        type: "SLAB_DISCOUNT",
        minQty: 3,
        discountPercent: 5,
        description: "5% discount on 3 or more cases",
      },
    }),
    // Hand soap: Buy 5 cases get 1 free
    prisma.scheme.create({
      data: {
        productId: productMap.get("SKU-HS-200")!.id,
        type: "BUY_X_GET_Y",
        minQty: 5,
        freeQty: 1,
        description: "Buy 5 cases get 1 case free",
      },
    }),
  ]);

  console.log(`🏷️  Created ${schemes.length} schemes`);

  // ─── SKU ALIASES ─────────────────────────────────────────────────────

  const aliases = await prisma.$transaction([
    // Glucose biscuit aliases
    prisma.skuAlias.create({
      data: {
        alias: "biscuit chhota",
        productId: productMap.get("SKU-BS-075")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "glucose 75",
        productId: productMap.get("SKU-BS-075")!.id,
        language: "en",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "chhota biscuit",
        productId: productMap.get("SKU-BS-075")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "biscuit bada",
        productId: productMap.get("SKU-BS-150")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "glucose 150",
        productId: productMap.get("SKU-BS-150")!.id,
        language: "en",
      },
    }),
    // Cream biscuit aliases
    prisma.skuAlias.create({
      data: {
        alias: "cream biscuit",
        productId: productMap.get("SKU-CB-100")!.id,
        language: "en",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "chocolate biscuit",
        productId: productMap.get("SKU-CB-100")!.id,
        language: "en",
      },
    }),
    // Cookie aliases
    prisma.skuAlias.create({
      data: {
        alias: "butter cookie",
        productId: productMap.get("SKU-CK-200")!.id,
        language: "en",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "cookies",
        productId: productMap.get("SKU-CK-200")!.id,
        language: "en",
      },
    }),
    // Detergent aliases
    prisma.skuAlias.create({
      data: {
        alias: "washing powder 1 kilo",
        productId: productMap.get("SKU-DT-1KG")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "detergent bada",
        productId: productMap.get("SKU-DT-1KG")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "washing powder chhota",
        productId: productMap.get("SKU-DT-500")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "sabun bar",
        productId: productMap.get("SKU-DB-250")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "kapde ka sabun",
        productId: productMap.get("SKU-DB-250")!.id,
        language: "hi",
      },
    }),
    // Dishwash alias
    prisma.skuAlias.create({
      data: {
        alias: "bartan sabun",
        productId: productMap.get("SKU-DW-500")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "dishwash",
        productId: productMap.get("SKU-DW-500")!.id,
        language: "en",
      },
    }),
    // Floor cleaner alias
    prisma.skuAlias.create({
      data: {
        alias: "floor cleaner",
        productId: productMap.get("SKU-FC-1LT")!.id,
        language: "en",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "phenyl",
        productId: productMap.get("SKU-FC-1LT")!.id,
        language: "hi",
      },
    }),
    // Tea aliases
    prisma.skuAlias.create({
      data: {
        alias: "chai patti 250",
        productId: productMap.get("SKU-TE-250")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "tea leaf chhoti",
        productId: productMap.get("SKU-TE-250")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "chai patti badi",
        productId: productMap.get("SKU-TE-500")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "chai patti 500",
        productId: productMap.get("SKU-TE-500")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "tea bags bada pack",
        productId: productMap.get("SKU-TB-100")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "tea bags chhota",
        productId: productMap.get("SKU-TB-025")!.id,
        language: "hi",
      },
    }),
    // Soap/personal care aliases
    prisma.skuAlias.create({
      data: {
        alias: "hath ka sabun",
        productId: productMap.get("SKU-HS-200")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "hand soap",
        productId: productMap.get("SKU-HS-200")!.id,
        language: "en",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "dant manjan",
        productId: productMap.get("SKU-TW-100")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "tooth powder",
        productId: productMap.get("SKU-TW-100")!.id,
        language: "en",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "nariyal tel",
        productId: productMap.get("SKU-HC-100")!.id,
        language: "hi",
      },
    }),
    prisma.skuAlias.create({
      data: {
        alias: "coconut oil",
        productId: productMap.get("SKU-HC-100")!.id,
        language: "en",
      },
    }),
  ]);

  console.log(`🏷️  Created ${aliases.length} SKU aliases`);

  // ─── ORDERS ──────────────────────────────────────────────────────────

  // Order 1: PENDING - Sharma General Store, placed via APP
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0001",
      userId: retailers[0].id,
      status: "PENDING",
      subtotal: 3540.0,
      discount: 0,
      total: 3540.0,
      gstAmount: 540.0,
      source: "APP",
      notes: "Deliver before 11am",
      items: {
        create: [
          {
            productId: productMap.get("SKU-BS-075")!.id,
            quantity: 5,
            unitPrice: 8.85,
            total: 4248.0, // 5 cases * 96 units * 8.85
          },
          {
            productId: productMap.get("SKU-DT-1KG")!.id,
            quantity: 2,
            unitPrice: 110.65,
            total: 4426.0, // 2 cases * 20 units * 110.65
          },
        ],
      },
    },
  });

  // Order 2: CONFIRMED - Gupta Kirana, placed via AI_TEXT
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0002",
      userId: retailers[1].id,
      status: "CONFIRMED",
      subtotal: 5144.0,
      discount: 154.32,
      total: 4989.68,
      gstAmount: 784.35,
      source: "AI_TEXT",
      aiConfidence: 0.92,
      aiRawInput: "biscuit chhota 10 case, washing powder 1 kilo 5 case, chai patti 250 2 case",
      freeGoods: JSON.stringify([
        {
          productId: productMap.get("SKU-BS-075")!.id,
          name: "Shakti Glucose Biscuit 75g",
          quantity: 1,
          reason: "Buy 10 get 1 free",
        },
      ]),
      items: {
        create: [
          {
            productId: productMap.get("SKU-BS-075")!.id,
            quantity: 10,
            unitPrice: 8.85,
            total: 8496.0,
            originalText: "biscuit chhota 10 case",
            confidence: 0.95,
          },
          {
            productId: productMap.get("SKU-DT-1KG")!.id,
            quantity: 5,
            unitPrice: 110.65,
            total: 11065.0,
            originalText: "washing powder 1 kilo 5 case",
            confidence: 0.91,
          },
          {
            productId: productMap.get("SKU-TE-250")!.id,
            quantity: 2,
            unitPrice: 128.6,
            total: 10288.0,
            originalText: "chai patti 250 2 case",
            confidence: 0.88,
          },
          {
            productId: productMap.get("SKU-BS-075")!.id,
            quantity: 1,
            unitPrice: 0,
            total: 0,
            isFreeGood: true,
            originalText: "Free: 1 case glucose 75g (scheme)",
            confidence: 1.0,
          },
        ],
      },
    },
  });

  // Order 3: CREDIT_HOLD - Gupta Kirana (near credit limit)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0003",
      userId: retailers[1].id,
      status: "CREDIT_HOLD",
      subtotal: 6420.0,
      discount: 0,
      total: 6420.0,
      gstAmount: 978.98,
      source: "SALESMAN",
      notes: "Credit limit exceeded - needs approval",
      items: {
        create: [
          {
            productId: productMap.get("SKU-TE-500")!.id,
            quantity: 3,
            unitPrice: 239.8,
            total: 14388.0,
          },
          {
            productId: productMap.get("SKU-DW-500")!.id,
            quantity: 2,
            unitPrice: 69.75,
            total: 3348.0,
          },
          {
            productId: productMap.get("SKU-HS-200")!.id,
            quantity: 3,
            unitPrice: 28.9,
            total: 6242.4,
          },
        ],
      },
    },
  });

  // Order 4: CONFIRMED - Agrawal Provision, placed via AI_IMAGE
  const order4 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0004",
      userId: retailers[2].id,
      status: "CONFIRMED",
      subtotal: 7830.0,
      discount: 234.9,
      total: 7595.1,
      gstAmount: 1159.27,
      source: "AI_IMAGE",
      aiConfidence: 0.85,
      aiRawInput: "[Photo of handwritten order list]",
      items: {
        create: [
          {
            productId: productMap.get("SKU-CB-100")!.id,
            quantity: 4,
            unitPrice: 21.8,
            total: 5232.0,
            originalText: "cream biscuit 4 case",
            confidence: 0.87,
          },
          {
            productId: productMap.get("SKU-FC-1LT")!.id,
            quantity: 3,
            unitPrice: 89.9,
            total: 3236.4,
            originalText: "floor cleaner 3 case",
            confidence: 0.82,
          },
          {
            productId: productMap.get("SKU-HC-100")!.id,
            quantity: 2,
            unitPrice: 45.25,
            total: 4344.0,
            originalText: "nariyal tel 2 case",
            confidence: 0.9,
          },
        ],
      },
    },
  });

  // Order 5: PENDING - Sahu Grocery, placed via APP
  const order5 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2024-0005",
      userId: retailers[3].id,
      status: "PENDING",
      subtotal: 2150.0,
      discount: 0,
      total: 2150.0,
      gstAmount: 328.0,
      source: "APP",
      items: {
        create: [
          {
            productId: productMap.get("SKU-DB-250")!.id,
            quantity: 3,
            unitPrice: 14.7,
            total: 3528.0,
          },
          {
            productId: productMap.get("SKU-TB-025")!.id,
            quantity: 2,
            unitPrice: 40.9,
            total: 3926.4,
          },
          {
            productId: productMap.get("SKU-TW-100")!.id,
            quantity: 1,
            unitPrice: 22.9,
            total: 1374.0,
          },
        ],
      },
    },
  });

  console.log(`📋 Created 5 orders`);

  console.log("\n✅ Seed completed successfully!");
  console.log("───────────────────────────────────────");
  console.log(`   Users:      ${1 + 2 + 3 + retailers.length}`);
  console.log(`   Products:   ${products.length}`);
  console.log(`   Schemes:    ${schemes.length}`);
  console.log(`   Aliases:    ${aliases.length}`);
  console.log(`   Orders:     5`);
  console.log("───────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
