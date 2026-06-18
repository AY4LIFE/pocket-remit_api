import redis from '../config/redis.js'

// ------------------------------------
// FXSERVICE
// Responsible for two things:
//   1. Fetching exchange rates (from cache or API)
//   2. Converting amounts between currencies
// ------------------------------------
export class FxService {

    // GETRATE: Takes two currency codes and returns the exchange rate
    async getRate(from: string, to: string): Promise<number> {
        
    // STEP 1 — CHECK REDIS FIRST (cache-aside)
    // Our cache key is structured as "fx:FROM:TO"
    // e.g. "fx:NGN:USD", "fx:USD:GHS"
    //
    // This naming convention is called a "namespace" —
    // prefixing keys with "fx:" keeps them organized
    // and avoids clashing with other Redis keys
    // ------------------------------------
    const cacheKey = `fx: ${from}:${to}`
    const cached = await redis.get(cacheKey)

    if (cached) {
        console.log(`Cache hit for ${cacheKey}`)
        return parseFloat(cached)
    } // Cache Hit - Return immediately, no API calls needed

    // ------------------------------------
    // STEP 2 — CACHE MISS → FETCH FROM API
    // Only reaches here if Redis didn't have the rate.
    // Call the free exchangerate API with the base currency
    console.log(`Cache miss for ${cacheKey} - fetching from API`)
    const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
    )
    if(!response.ok){
        throw new Error(`Failed to fetch exchange rate for ${from}`)
    }
    const data = await response.json() as {rates: Record<string, number>}

    // Extract the specific rate we need
    const rate = data.rates[to]
    if (!rate){
        throw new Error (`Exchange rate not found for ${from} -> ${to}`)
    }

    // STEP 3: Store in Redis with a TIL (EX)
    await redis.set(cacheKey, rate.toString(), {EX: 300})
    return rate

    }

    // ------------------------------------
  // CONVERT
  // Takes an amount in one currency and converts it to another.
  // Reuses getRate() so caching applies here too automatically.
  //
  // e.g. convert('NGN', 'USD', 5000) → 3.25
  // ------------------------------------

  async convert(
    from: string,
    to: string,
    amount: number
  ): Promise<{
    from: string,
    to: string,
    amount: number,
    rate: number,
    result: number
    
  }>{
    const rate = await this.getRate(from, to)
    // ------------------------------------
    // PRECISION
    // We round to 4 decimal places — same precision
    // as our wallet balance columns in the DB
    // ------------------------------------

    const result = parseFloat((amount * rate).toFixed(4))

    return {
        from, to, amount, rate, result
    }
  }
}