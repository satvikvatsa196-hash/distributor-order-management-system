// ---------------------------------------------------------------------------
// Scheme Engine – calculates BUY_X_GET_Y and SLAB_DISCOUNT schemes for a cart
// ---------------------------------------------------------------------------

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  skuCode: string
  name: string
  quantity: number
  unitPrice: number
  schemes: SchemeInfo[]
}

export interface SchemeInfo {
  id: string
  type: 'BUY_X_GET_Y' | 'SLAB_DISCOUNT'
  minQty: number
  freeQty: number
  discountPercent: number
  description: string
}

export interface SchemeResult {
  productId: string
  skuCode: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  discount: number
  freeGoods: number
  appliedScheme: string | null
  schemeBreakdown: string | null
}

export interface CartResult {
  items: SchemeResult[]
  subtotal: number
  totalDiscount: number
  freeGoodsSummary: { name: string; quantity: number }[]
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Apply a BUY_X_GET_Y scheme to a given quantity.
 *
 * For every `minQty` cases purchased the buyer gets `freeQty` cases free.
 * Partial slabs (remaining cases after full multiples) do NOT qualify.
 *
 * Example: minQty=10, freeQty=1
 *   qty=10 → 1 free   (1 full slab)
 *   qty=15 → 1 free   (1 full slab, 5 remaining – not enough for another)
 *   qty=20 → 2 free   (2 full slabs)
 *   qty=30 → 3 free   (3 full slabs)
 */
function applyBuyXGetY(
  quantity: number,
  scheme: SchemeInfo
): { freeGoods: number; breakdown: string } {
  const slabs = Math.floor(quantity / scheme.minQty)
  const freeGoods = slabs * scheme.freeQty
  const remaining = quantity % scheme.minQty

  let breakdown = `Buy ${scheme.minQty} Get ${scheme.freeQty} Free`
  if (slabs > 0) {
    breakdown += ` — ${slabs} slab${slabs > 1 ? 's' : ''} qualified`
    breakdown += ` (${slabs}×${scheme.freeQty} = ${freeGoods} free)`
    if (remaining > 0) {
      breakdown += `, ${remaining} case${remaining > 1 ? 's' : ''} remaining`
    }
  } else {
    breakdown += ` — Need ${scheme.minQty} cases, ordered only ${quantity}`
  }

  return { freeGoods, breakdown }
}

/**
 * Apply a SLAB_DISCOUNT scheme.
 *
 * If the ordered quantity meets or exceeds `minQty`, the entire line total
 * receives `discountPercent`% off.
 */
function applySlabDiscount(
  quantity: number,
  lineTotal: number,
  scheme: SchemeInfo
): { discount: number; breakdown: string } {
  if (quantity >= scheme.minQty) {
    const discount = Math.round((lineTotal * scheme.discountPercent) / 100 * 100) / 100
    const breakdown =
      `${scheme.discountPercent}% off on ${quantity} cases` +
      ` (min ${scheme.minQty}) — Discount ₹${discount.toFixed(2)}`
    return { discount, breakdown }
  }

  return {
    discount: 0,
    breakdown:
      `${scheme.discountPercent}% off requires min ${scheme.minQty} cases` +
      ` — ordered only ${quantity}`,
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Calculate all applicable schemes for a cart of items.
 *
 * Strategy per item:
 *   1. Evaluate every attached scheme.
 *   2. Pick the **best** scheme (the one that gives the most monetary benefit).
 *      – For BUY_X_GET_Y the monetary value = freeGoods × unitPrice.
 *      – For SLAB_DISCOUNT the monetary value = discount amount.
 *   3. Only one scheme is applied per line item (the most beneficial one).
 */
export function calculateSchemes(items: CartItem[]): CartResult {
  const results: SchemeResult[] = []
  const freeGoodsSummary: { name: string; quantity: number }[] = []
  let subtotal = 0
  let totalDiscount = 0

  for (const item of items) {
    const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100
    subtotal += lineTotal

    // Track the best scheme outcome
    let bestBenefit = 0
    let bestResult: {
      discount: number
      freeGoods: number
      appliedScheme: string
      schemeBreakdown: string
    } | null = null

    for (const scheme of item.schemes) {
      if (scheme.type === 'BUY_X_GET_Y') {
        const { freeGoods, breakdown } = applyBuyXGetY(item.quantity, scheme)
        const monetaryBenefit = freeGoods * item.unitPrice

        if (monetaryBenefit > bestBenefit) {
          bestBenefit = monetaryBenefit
          bestResult = {
            discount: 0,
            freeGoods,
            appliedScheme: scheme.description || `Buy ${scheme.minQty} Get ${scheme.freeQty}`,
            schemeBreakdown: breakdown,
          }
        }
      } else if (scheme.type === 'SLAB_DISCOUNT') {
        const { discount, breakdown } = applySlabDiscount(
          item.quantity,
          lineTotal,
          scheme
        )

        if (discount > bestBenefit) {
          bestBenefit = discount
          bestResult = {
            discount,
            freeGoods: 0,
            appliedScheme: scheme.description || `${scheme.discountPercent}% off`,
            schemeBreakdown: breakdown,
          }
        }
      }
    }

    // Build the result for this line item
    const schemeResult: SchemeResult = {
      productId: item.productId,
      skuCode: item.skuCode,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal,
      discount: bestResult?.discount ?? 0,
      freeGoods: bestResult?.freeGoods ?? 0,
      appliedScheme: bestResult?.appliedScheme ?? null,
      schemeBreakdown: bestResult?.schemeBreakdown ?? null,
    }

    totalDiscount += schemeResult.discount

    // Accumulate free goods summary
    if (schemeResult.freeGoods > 0) {
      const existing = freeGoodsSummary.find((fg) => fg.name === item.name)
      if (existing) {
        existing.quantity += schemeResult.freeGoods
      } else {
        freeGoodsSummary.push({ name: item.name, quantity: schemeResult.freeGoods })
      }
    }

    results.push(schemeResult)
  }

  const total = Math.round((subtotal - totalDiscount) * 100) / 100

  return {
    items: results,
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    freeGoodsSummary,
    total,
  }
}
