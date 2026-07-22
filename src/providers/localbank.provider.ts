import {BaseProvider} from './base.provider.js'
import type {TransferRequest, TransferResult} from './base.provider.js'

// ------------------------------------
// SLEEP HELPER
// Real bank API calls take time — maybe 200-500ms.
// This function lets us simulate that delay artificially.
//
// How it works:
//   await sleep(200) → pauses execution for 200 milliseconds, then continues
// ------------------------------------

const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// ------------------------------------
// LOCALBANKPROVIDER
// "extends BaseProvider" means:
//   - This class is a child of BaseProvider
//   - It MUST implement all abstract methods (lookupAccount, initiateTransfer)
//   - It MUST declare name and supportedCurrencies
//   - TypeScript will give you an error if you forget any of them
// ------------------------------------
export class LocalBankProvider extends BaseProvider{
    // Satisfies the abstract "name" requirement from BaseProvider
    readonly name = 'LocalBank'
    // Satisfies the supported Currencies requirements from BaseProvider
    readonly supportedCurrencies = ['NGN']

// ------------------------------------
  // LOOKUPACCOUNT
  // In a real system, this would call the bank's API to verify the account.
  // Here we simulate it — we derive a fake name from the account number.
  //
  // Why deterministic? (same input → always same output)
  // So that tests can predict the result. If it were random, tests would break randomly.
  // ------------------------------------
  async lookupAccount(accountNumber: string): Promise<{accountName: string}> {
    await sleep(200) // Simulate network latency

    // .slice(-4) takes the last 4 characters of the account number
    // e.g. accountNumber = "0123456789" → slice(-4) = "6789"
    // This gives every account a unique-ish but predictable fake name
    return {accountName: `Account Holder ${accountNumber.slice(-4)}`}
  }

  async getTransferStatus(providerReference: string): Promise<TransferResult>{
    await sleep(200) // Simulate network latency

    // In a real bank, you'd call their API with the reference
    // and get back the current status.
    // Here we simulate it — LocalBank transfers resolve quickly
    // so we return success for any existing reference.

    return {
        success: true,
        providerReference: providerReference,
        status: 'success',
        message: 'Transfer completed successfully'
    }
  }
    // ------------------------------------
  // INITIATETRANSFER
  // Simulates sending money through LocalBank.
  // Succeeds 95% of the time, fails 5% — just like a real provider might.
  // ------------------------------------
  async initiateTransfer(req: TransferRequest): Promise<TransferResult>{
    await sleep(300)    // Simulate network latency

    // Math.random() returns a number between 0 and 1
    // So Math.random() < 0.05 is true roughly 5% of the time
    const willFail = Math.random() < 0.05

    // If willFail is true → transfer failed
    // If willFail is false → transfer succeeded
    return {
        success: !willFail,
        providerReference: `LB-${Date.now()}`, // Date.now() gives current timesatmp
        status: willFail? 'failed': 'success',
        message: willFail 
        ? 'Transfer failed due to a provider error' 
        : 'Transfer completed successfully'
    }
  }
}