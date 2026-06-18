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

    

    }
}