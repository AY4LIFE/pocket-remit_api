// Transfer Request
// This is the shape of the data we send to a bank when making a transfer
// This is the 'form' you fill out before wiring money

export interface TransferRequest{
    fromAccount: string                         // The sender's account number
    toAccount: string                           // The recipient's account number
    toBankCode: string                          // A code identifying the recipient's bank
    amount: number                              // How much to send
    currency: string                            // eg 'NGN', 'USD', 'GHS'
    narration: string                           // A note/description for the transfer
}

// Transfer Result
// This is the shape of the data we get back from a bank after a transfer attempt

export interface TransferResult{
    success: boolean                            // Did it work?
    providerReference: string                   // The bank's own ID for this transfer
    status: 'pending' | 'success' | 'failed'    // Current state of the transfer
    message: string                             // Human-readable description
}


// ------------------------------------
// BASEPROVIDER
// This is the abstract class — the contract every bank must follow.
//
// "abstract" means:
//   - You can NEVER do: new BaseProvider()
//   - You can only EXTEND it: class LocalBankProvider extends BaseProvider
//   - Any method marked "abstract" has NO body here — child classes MUST implement it
// ------------------------------------

export abstract class BaseProvider{
    // Every provider must have a name ('Localbank', 'Globalbank')
    abstract readonly name: string
    // Every provider must declare what currencies it support
    abstract readonly supportedCurrencies: string[]

    // Every provider must be able to look up an account name
    // We don't care about the How - each bank does it differently
    abstract lookupAccount(
        accountNumber: string
    ): Promise<{accountName: string}>

    // Every provider must be able to initiate a transfer
    // We don't care about the how - each bank does it differently
    abstract initiateTransfer(req: TransferRequest): Promise<TransferResult>
}