// ---------------------------------------------------------------------------
// AI Order Parser – Parses natural-language (Hindi/Hinglish) text orders
// into structured order items using Google Gemini with a local fallback.
// ---------------------------------------------------------------------------

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductInfo {
  id: string
  skuCode: string
  name: string
  nameHindi?: string
  dealerPrice: number
  retailerPrice: number
  stock: number
  unit: string
}

export interface AliasInfo {
  alias: string
  productId: string
}

export interface ParsedOrderItem {
  originalText: string
  matchedProductId: string | null
  matchedProductName: string | null
  matchedSkuCode: string | null
  quantity: number
  unit: string // "case" or "piece"
  unitPrice: number
  confidence: number // 0-1
  alternatives: {
    productId: string
    name: string
    skuCode: string
    confidence: number
  }[]
  needsUnitClarification: boolean
  status: 'matched' | 'low_confidence' | 'unmatched'
}

export interface ParseResult {
  items: ParsedOrderItem[]
  rawInput: string
  parseMethod: 'ai' | 'local'
  overallConfidence: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const API_TIMEOUT_MS = 5000

// Common Hindi/Hinglish unit mappings
const UNIT_MAP: Record<string, string> = {
  peti: 'case',
  petti: 'case',
  case: 'case',
  cases: 'case',
  carton: 'case',
  dabba: 'case',
  dabbe: 'case',
  box: 'case',
  packet: 'piece',
  packets: 'piece',
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  unit: 'piece',
  units: 'piece',
  bag: 'case',
  bags: 'case',
}

// Hindi number words
const HINDI_NUMBERS: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  paanch: 5,
  panch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  bees: 20,
  pachas: 50,
  sau: 100,
  dedh: 1.5,
  dhai: 2.5,
  aadha: 0.5,
}

// ─── Gemini AI Parser ─────────────────────────────────────────────────────────

function buildGeminiPrompt(
  text: string,
  products: ProductInfo[],
  aliases: AliasInfo[]
): string {
  const productList = products
    .map(
      (p) =>
        `- ID: ${p.id}, SKU: ${p.skuCode}, Name: "${p.name}"${p.nameHindi ? `, Hindi: "${p.nameHindi}"` : ''}, Unit: ${p.unit}, Price: ₹${p.retailerPrice}, Stock: ${p.stock}`
    )
    .join('\n')

  const aliasList = aliases
    .map((a) => `- "${a.alias}" → productId: ${a.productId}`)
    .join('\n')

  return `You are an order parsing assistant for an Indian FMCG distributor. Parse the following Hindi/Hinglish text order into structured items.

PRODUCT CATALOG:
${productList}

PRODUCT ALIASES (common nicknames):
${aliasList || '(none)'}

UNIT MAPPINGS:
- "peti" / "petti" / "carton" / "dabba" / "box" / "bag" = case
- "packet" / "piece" / "pc" = piece
- Weight suffixes like "250 wala", "1 kilo", "500g" help identify the specific SKU variant

ORDER TEXT:
"${text}"

INSTRUCTIONS:
1. Split the text into individual order items.
2. For each item, identify the product, quantity, and unit.
3. Match each item to the closest product in the catalog using name, Hindi name, and aliases.
4. Assign a confidence score (0-1) for each match.
5. If confidence < 0.8, suggest up to 2 alternative product matches.
6. Flag items where the unit is unclear (needsUnitClarification: true).
7. Hindi number words: ek=1, do=2, teen=3, char=4, paanch=5, etc.

Return ONLY valid JSON (no markdown fences) in this exact format:
{
  "items": [
    {
      "originalText": "the segment of text for this item",
      "matchedProductId": "product-id or null",
      "matchedProductName": "product name or null",
      "matchedSkuCode": "sku-code or null",
      "quantity": 5,
      "unit": "case",
      "unitPrice": 100,
      "confidence": 0.95,
      "alternatives": [],
      "needsUnitClarification": false,
      "status": "matched"
    }
  ]
}

Status rules:
- confidence >= 0.8 → "matched"
- confidence >= 0.4 and < 0.8 → "low_confidence"  
- confidence < 0.4 or no match → "unmatched"`
}

async function callGeminiAPI(prompt: string): Promise<ParsedOrderItem[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const textContent =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Strip markdown code fences if present
    const jsonStr = textContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed = JSON.parse(jsonStr)
    return parsed.items as ParsedOrderItem[]
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ─── Local Fallback Parser ───────────────────────────────────────────────────

/**
 * Levenshtein distance between two strings (case-insensitive).
 */
function levenshtein(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  const m = al.length
  const n = bl.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = al[i - 1] === bl[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  return dp[m][n]
}

/**
 * Compute a similarity score (0-1) between two strings using Levenshtein distance.
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

/**
 * Check if `haystack` contains `needle` as a substring (case-insensitive).
 */
function containsSubstring(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

/**
 * Score a product against a query string. Returns 0-1.
 */
function scoreProduct(
  query: string,
  product: ProductInfo,
  aliases: AliasInfo[]
): number {
  const q = query.toLowerCase().trim()
  let bestScore = 0

  // Check product name
  const nameSim = similarity(q, product.name.toLowerCase())
  bestScore = Math.max(bestScore, nameSim)

  // Check if query is a substring of product name or vice versa
  if (containsSubstring(product.name, q)) {
    bestScore = Math.max(bestScore, 0.7 + 0.2 * (q.length / product.name.length))
  }
  if (containsSubstring(q, product.name.toLowerCase())) {
    bestScore = Math.max(bestScore, 0.65)
  }

  // Check individual words of product name
  const productWords = product.name.toLowerCase().split(/\s+/)
  for (const word of productWords) {
    if (word.length < 3) continue
    const wordSim = similarity(q, word)
    if (wordSim > 0.7) {
      bestScore = Math.max(bestScore, wordSim * 0.85)
    }
    if (containsSubstring(q, word)) {
      bestScore = Math.max(bestScore, 0.6)
    }
  }

  // Check Hindi name
  if (product.nameHindi) {
    const hindiSim = similarity(q, product.nameHindi.toLowerCase())
    bestScore = Math.max(bestScore, hindiSim)
    if (containsSubstring(product.nameHindi, q)) {
      bestScore = Math.max(bestScore, 0.75)
    }
  }

  // Check SKU code
  if (containsSubstring(q, product.skuCode.toLowerCase())) {
    bestScore = Math.max(bestScore, 0.9)
  }

  // Check aliases
  const productAliases = aliases.filter((a) => a.productId === product.id)
  for (const alias of productAliases) {
    const aliasSim = similarity(q, alias.alias.toLowerCase())
    bestScore = Math.max(bestScore, aliasSim)
    if (containsSubstring(q, alias.alias.toLowerCase())) {
      bestScore = Math.max(bestScore, 0.8)
    }
    if (containsSubstring(alias.alias, q)) {
      bestScore = Math.max(bestScore, 0.75)
    }
  }

  return Math.min(bestScore, 1)
}

/**
 * Extract individual order segments from the text.
 * Splits on commas, "aur", "and", newlines, etc.
 */
function splitOrderText(text: string): string[] {
  return text
    .split(/[,\n]+|(?:\s+aur\s+)|(?:\s+and\s+)/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Extract quantity and remaining product text from a segment.
 */
function extractQuantityAndProduct(rawSegment: string): {
  quantity: number
  unit: string
  productQuery: string
  needsUnitClarification: boolean
} {
  let quantity = 1
  let unit = 'case'
  let needsUnitClarification = false

  // Strip conversational Hindi prefixes and suffixes
  let segment = rawSegment
    .replace(/^(?:bhaiya|bhai|sir|are\s+bhaiya|are\s+bhai|namaste|hello|ji)\s+/i, '')
    .replace(/\s+(?:bhej\s+dena|bhej\s+do|chahiye|de\s+dena|kar\s+do|wala)\s*$/i, '')
    .trim()

  let productQuery = segment

  // Try to extract a number at the start or end
  // Pattern: "<number> <unit> <product>" or "<product> <number> <unit>"
  const patterns = [
    // "5 peti biscuit" or "5 petti chai"
    /^(\d+(?:\.\d+)?)\s+(peti|petti|case|cases|carton|dabba|dabbe|box|bag|bags|packet|packets|piece|pieces|pc|pcs|unit|units)\s+(.+)$/i,
    // "biscuit 5 peti"
    /^(.+?)\s+(\d+(?:\.\d+)?)\s+(peti|petti|case|cases|carton|dabba|dabbe|box|bag|bags|packet|packets|piece|pieces|pc|pcs|unit|units)$/i,
    // "5 biscuit" (no unit specified)
    /^(\d+(?:\.\d+)?)\s+(.+)$/i,
    // "biscuit 5"
    /^(.+?)\s+(\d+(?:\.\d+)?)$/i,
  ]

  // Pattern 1: qty unit product
  let match = segment.match(patterns[0])
  if (match) {
    quantity = parseFloat(match[1])
    unit = UNIT_MAP[match[2].toLowerCase()] || 'case'
    productQuery = match[3].trim()
    return { quantity, unit, productQuery, needsUnitClarification: false }
  }

  // Pattern 2: product qty unit
  match = segment.match(patterns[1])
  if (match) {
    productQuery = match[1].trim()
    quantity = parseFloat(match[2])
    unit = UNIT_MAP[match[3].toLowerCase()] || 'case'
    return { quantity, unit, productQuery, needsUnitClarification: false }
  }

  // Pattern 3: qty product (no unit → flag for clarification)
  match = segment.match(patterns[2])
  if (match) {
    const possibleQty = parseFloat(match[1])
    if (!isNaN(possibleQty)) {
      quantity = possibleQty
      productQuery = match[2].trim()
      needsUnitClarification = true
    }
  }

  // Pattern 4: product qty (no unit)
  if (!match || quantity === 1) {
    match = segment.match(patterns[3])
    if (match) {
      const possibleQty = parseFloat(match[2])
      if (!isNaN(possibleQty) && possibleQty > 0 && possibleQty < 10000) {
        productQuery = match[1].trim()
        quantity = possibleQty
        needsUnitClarification = true
      }
    }
  }

  // Check for Hindi number words
  for (const [word, num] of Object.entries(HINDI_NUMBERS)) {
    const hindiPattern = new RegExp(`\\b${word}\\b`, 'i')
    if (hindiPattern.test(segment)) {
      quantity = num
      productQuery = segment.replace(hindiPattern, '').trim()
      break
    }
  }

  // Remove known unit words from the product query
  for (const unitWord of Object.keys(UNIT_MAP)) {
    const unitPattern = new RegExp(`\\b${unitWord}\\b`, 'gi')
    if (unitPattern.test(productQuery)) {
      unit = UNIT_MAP[unitWord.toLowerCase()] || unit
      productQuery = productQuery.replace(unitPattern, '').trim()
      needsUnitClarification = false
    }
  }

  // Clean up extra whitespace
  productQuery = productQuery.replace(/\s+/g, ' ').trim()

  return { quantity, unit, productQuery, needsUnitClarification }
}

/**
 * Local (offline) fallback parser. Uses regex + string similarity matching.
 */
export function parseTextOrderLocal(
  text: string,
  products: ProductInfo[],
  aliases: AliasInfo[]
): ParseResult {
  const segments = splitOrderText(text)
  const items: ParsedOrderItem[] = []

  for (const segment of segments) {
    const { quantity, unit, productQuery, needsUnitClarification } =
      extractQuantityAndProduct(segment)

    // Score all products against the query
    const scored = products
      .map((p) => ({
        product: p,
        score: scoreProduct(productQuery, p, aliases),
      }))
      .sort((a, b) => b.score - a.score)

    const bestMatch = scored[0]
    const alternatives = scored
      .slice(1, 3)
      .filter((s) => s.score >= 0.3)
      .map((s) => ({
        productId: s.product.id,
        name: s.product.name,
        skuCode: s.product.skuCode,
        confidence: Math.round(s.score * 100) / 100,
      }))

    let status: 'matched' | 'low_confidence' | 'unmatched' = 'unmatched'
    let matchedProduct: ProductInfo | null = null
    let confidence = 0

    if (bestMatch && bestMatch.score >= 0.8) {
      status = 'matched'
      matchedProduct = bestMatch.product
      confidence = bestMatch.score
    } else if (bestMatch && bestMatch.score >= 0.4) {
      status = 'low_confidence'
      matchedProduct = bestMatch.product
      confidence = bestMatch.score
    } else {
      status = 'unmatched'
      confidence = bestMatch?.score ?? 0
    }

    // Cap local confidence slightly lower than AI to signal lower reliability
    confidence = Math.min(confidence, 0.92)
    confidence = Math.round(confidence * 100) / 100

    items.push({
      originalText: segment,
      matchedProductId: matchedProduct?.id ?? null,
      matchedProductName: matchedProduct?.name ?? null,
      matchedSkuCode: matchedProduct?.skuCode ?? null,
      quantity,
      unit,
      unitPrice: matchedProduct?.retailerPrice ?? 0,
      confidence,
      alternatives:
        status === 'matched' && confidence >= 0.8 ? [] : alternatives,
      needsUnitClarification,
      status,
    })
  }

  const totalConfidence =
    items.length > 0
      ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length
      : 0

  return {
    items,
    rawInput: text,
    parseMethod: 'local',
    overallConfidence: Math.round(totalConfidence * 100) / 100,
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Parse a natural-language text order into structured items.
 *
 * Attempts the Gemini AI API first; on any failure falls back to the local
 * regex + string-similarity parser.
 */
export async function parseTextOrder(
  text: string,
  products: ProductInfo[],
  aliases: AliasInfo[]
): Promise<ParseResult> {
  // Try AI parser first
  try {
    const prompt = buildGeminiPrompt(text, products, aliases)
    const aiItems = await callGeminiAPI(prompt)

    // Validate and enrich AI results
    const validatedItems: ParsedOrderItem[] = aiItems.map((item) => {
      // Verify the matched product actually exists
      const product = item.matchedProductId
        ? products.find((p) => p.id === item.matchedProductId)
        : null

      if (!product && item.matchedProductId) {
        // AI hallucinated a product ID – try to find by name
        const byName = products.find(
          (p) =>
            p.name.toLowerCase() === item.matchedProductName?.toLowerCase()
        )
        if (byName) {
          item.matchedProductId = byName.id
          item.matchedSkuCode = byName.skuCode
          item.unitPrice = byName.retailerPrice
        } else {
          item.matchedProductId = null
          item.matchedProductName = null
          item.matchedSkuCode = null
          item.status = 'unmatched'
          item.confidence = 0
        }
      } else if (product) {
        // Ensure price is correct from our catalog
        item.unitPrice = product.retailerPrice
        item.matchedSkuCode = product.skuCode
        item.matchedProductName = product.name
      }

      // Normalize status based on confidence
      if (item.confidence >= 0.8 && item.matchedProductId) {
        item.status = 'matched'
      } else if (item.confidence >= 0.4 && item.matchedProductId) {
        item.status = 'low_confidence'
      } else {
        item.status = 'unmatched'
      }

      return item
    })

    const totalConfidence =
      validatedItems.length > 0
        ? validatedItems.reduce((sum, i) => sum + i.confidence, 0) /
          validatedItems.length
        : 0

    return {
      items: validatedItems,
      rawInput: text,
      parseMethod: 'ai',
      overallConfidence: Math.round(totalConfidence * 100) / 100,
    }
  } catch (error) {
    // Fallback to local parser
    console.warn(
      '[ai-parser] Gemini API failed, falling back to local parser:',
      error instanceof Error ? error.message : error
    )
    return parseTextOrderLocal(text, products, aliases)
  }
}
