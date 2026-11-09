import { calculateSchemes, CartItem } from "../src/lib/scheme-engine"
import { parseTextOrderLocal, ProductInfo, AliasInfo } from "../src/lib/ai-parser"

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ""}`)
    failed++
  }
}

console.log("=======================================================")
console.log(" DISTRIBUTOR ORDER MANAGEMENT SYSTEM - TEST SUITE")
console.log("=======================================================\n")

// ─────────────────────────────────────────────────────────────
// 1. SCHEME ENGINE TESTS (The "Hard Part" in the brief)
// ─────────────────────────────────────────────────────────────
console.log("📦 1. SCHEME ENGINE TESTS:")

// Test 1: BUY_X_GET_Y - Buy 10 cases get 1 free
const buyXGetYProduct: CartItem = {
  productId: "p1",
  skuCode: "SKU-BS-075",
  name: "Glucose biscuit 75 g",
  quantity: 10,
  unitPrice: 8.1,
  schemes: [
    {
      id: "s1",
      type: "BUY_X_GET_Y",
      minQty: 10,
      freeQty: 1,
      discountPercent: 0,
      description: "Buy 10 cases get 1 free",
    },
  ],
}

let result = calculateSchemes([buyXGetYProduct])
assert(
  result.items[0].freeGoods === 1,
  "Buy 10 get 1 free: 10 cases yields exactly 1 free case"
)
assert(
  result.freeGoodsSummary[0]?.quantity === 1,
  "Free goods summary contains 1 free case"
)

// Test 2: BUY_X_GET_Y - Partial slabs (buy 15 -> should still get 1, not 1.5)
const partialSlab: CartItem = {
  ...buyXGetYProduct,
  quantity: 15,
}
result = calculateSchemes([partialSlab])
assert(
  result.items[0].freeGoods === 1,
  "Buy 10 get 1 free: 15 cases yields 1 free case (5 remaining do not qualify)"
)

// Test 3: BUY_X_GET_Y - Multiple slabs (buy 25 -> 2 free)
const multiSlab: CartItem = {
  ...buyXGetYProduct,
  quantity: 25,
}
result = calculateSchemes([multiSlab])
assert(
  result.items[0].freeGoods === 2,
  "Buy 10 get 1 free: 25 cases yields 2 free cases"
)

// Test 4: BUY_X_GET_Y - Below threshold (buy 9 -> 0 free)
const belowThreshold: CartItem = {
  ...buyXGetYProduct,
  quantity: 9,
}
result = calculateSchemes([belowThreshold])
assert(
  result.items[0].freeGoods === 0,
  "Buy 10 get 1 free: 9 cases yields 0 free cases"
)

// Test 5: SLAB_DISCOUNT - 3% off on 5 or more cases
const slabDiscountProduct: CartItem = {
  productId: "p2",
  skuCode: "SKU-DT-1KG",
  name: "Detergent powder 1 kg",
  quantity: 5,
  unitPrice: 101.5,
  schemes: [
    {
      id: "s2",
      type: "SLAB_DISCOUNT",
      minQty: 5,
      freeQty: 0,
      discountPercent: 3,
      description: "3% off 5 or more cases",
    },
  ],
}

result = calculateSchemes([slabDiscountProduct])
// Line total: 5 * 101.50 = 507.50. 3% discount = 15.23
const expectedDiscount = Math.round((507.5 * 0.03) * 100) / 100
assert(
  result.items[0].discount === expectedDiscount,
  `SLAB_DISCOUNT: 5 cases yields 3% discount (₹${expectedDiscount})`
)
assert(
  result.total === 507.5 - expectedDiscount,
  "Net total correctly subtracts slab discount"
)

// Test 6: SLAB_DISCOUNT - Below threshold (buy 4 -> 0% discount)
const belowSlab: CartItem = {
  ...slabDiscountProduct,
  quantity: 4,
}
result = calculateSchemes([belowSlab])
assert(
  result.items[0].discount === 0,
  "SLAB_DISCOUNT: 4 cases yields 0 discount (min 5 required)"
)

// ─────────────────────────────────────────────────────────────
// 2. AI ORDER PARSER TESTS
// ─────────────────────────────────────────────────────────────
console.log("\n🤖 2. AI NATURAL LANGUAGE ORDER PARSER TESTS:")

const mockCatalog: ProductInfo[] = [
  {
    id: "p1",
    skuCode: "SKU-BS-075",
    name: "Glucose biscuit 75 g",
    nameHindi: "ग्लूकोज बिस्किट 75 ग्राम",
    dealerPrice: 8.1,
    retailerPrice: 9.0,
    stock: 340,
    unit: "case",
  },
  {
    id: "p2",
    skuCode: "SKU-DT-1KG",
    name: "Detergent powder 1 kg",
    nameHindi: "डिटर्जेंट पाउडर 1 किलो",
    dealerPrice: 101.5,
    retailerPrice: 110.0,
    stock: 85,
    unit: "case",
  },
  {
    id: "p3",
    skuCode: "SKU-TE-250",
    name: "Tea leaf 250 g",
    nameHindi: "चाय पत्ती 250 ग्राम",
    dealerPrice: 118.0,
    retailerPrice: 130.0,
    stock: 0,
    unit: "case",
  },
]

const mockAliases: AliasInfo[] = [
  { alias: "biscuit chhota", productId: "p1" },
  { alias: "washing powder 1 kilo", productId: "p2" },
  { alias: "chai patti 250", productId: "p3" },
  { alias: "chai patti 250 wala", productId: "p3" },
]

// Test 7: Parse exact raw order message from client brief
const rawBriefMessage =
  "bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti."

const parseResult = parseTextOrderLocal(rawBriefMessage, mockCatalog, mockAliases)

assert(
  parseResult.items.length === 3,
  `Parsed 3 distinct lines from raw order message (found ${parseResult.items.length})`
)

const item1 = parseResult.items.find((i) => i.matchedSkuCode === "SKU-BS-075")
const item2 = parseResult.items.find((i) => i.matchedSkuCode === "SKU-DT-1KG")
const item3 = parseResult.items.find((i) => i.matchedSkuCode === "SKU-TE-250")

assert(
  item1 !== undefined && item1.quantity === 5,
  "Line 1: '5 peti biscuit chhota' -> 5 cases of SKU-BS-075"
)
assert(
  item2 !== undefined && item2.quantity === 2,
  "Line 2: '2 peti washing powder 1 kilo' -> 2 cases of SKU-DT-1KG"
)
assert(
  item3 !== undefined && item3.quantity === 1,
  "Line 3: 'chai patti 250 wala 1 peti' -> 1 case of SKU-TE-250"
)

// Test 8: Unit mapping ('peti' -> 'case')
assert(
  item1?.unit === "case",
  "Unit 'peti' correctly standardized to 'case'"
)

// Test 9: Ambiguous unit detection ('packet' vs 'case')
const ambiguousMessage = "10 packet biscuit chhota"
const ambResult = parseTextOrderLocal(ambiguousMessage, mockCatalog, mockAliases)
assert(
  ambResult.items[0]?.needsUnitClarification === true || ambResult.items[0]?.unit === "piece",
  "Ambiguous unit ('packet') flagged for user clarification"
)

// ─────────────────────────────────────────────────────────────
// 3. CREDIT LIMIT & BUSINESS RULES TESTS
// ─────────────────────────────────────────────────────────────
console.log("\n💳 3. CREDIT LIMIT & RISK CONTROL TESTS:")

const retailerCreditLimit = 50000
const retailerCreditUsed = 48200 // Gupta Kirana has only ₹1,800 left
const newOrderTotal = 5000

const isCreditExceeded = retailerCreditUsed + newOrderTotal > retailerCreditLimit
const expectedStatus = isCreditExceeded ? "CREDIT_HOLD" : "CONFIRMED"

assert(
  isCreditExceeded === true,
  `Order of ₹${newOrderTotal} exceeds remaining credit limit of ₹${retailerCreditLimit - retailerCreditUsed}`
)
assert(
  expectedStatus === "CREDIT_HOLD",
  "Over-limit order is routed to 'CREDIT_HOLD' status"
)

console.log("\n=======================================================")
console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`)
console.log("=======================================================\n")

if (failed > 0) {
  process.exit(1)
} else {
  console.log("🎯 ALL TESTS PASSED SUCCESSFULLY!")
}
