import {BaseProvider} from './base.provider.js'
import {LocalBankProvider} from "./localbank.provider.js"
import {GlobalBankProvider} from "./globalbank.provider.js"

// ------------------------------------
// PROVIDER MAP
// A plain object that maps currencies to their provider instances.
//
// Key insight: we create ONE instance of each provider and reuse it.
// We don't create a new LocalBankProvider() every time a transfer happens.
// This is more efficient — like having one bank teller per counter,
// not hiring a new one for every customer.
//
// Notice the type: Record<string, BaseProvider>
// This means: "keys are strings, values must be a BaseProvider"
// TypeScript will complain if you try to put something that isn't
// a BaseProvider in here — which is exactly what we want.
// ------------------------------------
const providers: Record<string, BaseProvider> = {
    NGN: new LocalBankProvider(),
    USD: new GlobalBankProvider(),
    GHS: new GlobalBankProvider(),
    EUR: new GlobalBankProvider()
}

// ------------------------------------
// GETPROVIDER
// The only function the rest of your app needs to know about.
//
// It takes a currency string, finds the matching provider,
// and returns it — typed as BaseProvider so the caller
// never needs to know if it's Local or Global underneath.
//
// If nobody supports the currency → throw a clear error immediately.
// Better to fail loud and early than silently send money nowhere.
// ------------------------------------
export function getProvider(currency: string): BaseProvider{
    const provider = providers[currency]

    // If currency is not in our map, provider will be undefined
    if (!provider){
        throw new Error(`No provider supports currency: ${currency}`)
    }
    return provider
}