import {BaseProvider} from './base.provider.js'
import type {TransferRequest, TransferResult} from './base.provider.js'

// Reusing the same sleep helper concept as LocalBank
const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// ------------------------------------
// GLOBALBANKPROVIDER
// Handles international transfers in USD, GHS, and EUR.
// Slower than LocalBank — international calls cross more infrastructure.
// Always returns 'pending' because SWIFT settlement is never instant.
// ------------------------------------
export class GlobalBankProvider extends BaseProvider{
    readonly name = 'GlobalBank'
    readonly supportedCurrencies = ['USD', 'GHS', 'EUR']

    // ------------------------------------
  // LOOKUPACCOUNT
  // Same concept as LocalBank — deterministic fake name from account number.
  // Slightly slower (500ms) because international account lookups
  // cross more network hops than local ones.
  // ------------------------------------

  async lookupAccount(accountNumber: string): Promise<{accountName: string}>{
    await sleep(500)
    return {accountName: `Global Account Holder ${accountNumber.slice(-4)}`}
  }

  // ------------------------------------
  // INITIATETRANSFER
  // This is the key difference from LocalBank.
  //
  // LocalBank  → resolves immediately (success or fail)
  // GlobalBank → ALWAYS returns 'pending' (never instantly done)
  //
  // This reflects how SWIFT international transfers actually work.
  // The transfer has been SUBMITTED, not COMPLETED.
  // ------------------------------------
  async initiateTransfer(req: TransferRequest): Promise<TransferResult>{
    await sleep(800)

    return {
        success: true, // We successfully submitted the transfer
        providerReference: `GB-${Date.now()}`,
        status: 'pending', // Transfer has not been completed yet
        message: 'Transfer submitted for pending'
    }
  }
}

