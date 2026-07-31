import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Create a mock for getProvider
const mockGetProvider = jest.fn()

// Use unstable_mockModule for ES modules
jest.unstable_mockModule('../../src/providers/provider.router.js', () => ({
    getProvider: mockGetProvider
}))

// Now import after mocking is set up
const { TransferService } = await import('../../src/services/transfer.services.js')

// ------------------------------------
// DESCRIBE BLOCK
// Groups all tests related to TransferService together
// ------------------------------------
describe('TransferService', () => {

    // ------------------------------------
    // NESTED DESCRIBE
    // You can nest describe() blocks to organize further
    // This groups all tests specifically about initiateTransfer()
    // ------------------------------------
    describe('initiateTransfer', () => {
        beforeEach(() => {
            // Reset mocks before each test
            jest.clearAllMocks()
        })

        it('throws an error when balance is insufficent', async () => {
            // ------------------------------------
            // ARRANGE
            // Set up everything the test needs before running.
            //
            // Create a real TransferService instance,
            // but we'll fake (mock) the getWallet() method
            // so it returns a wallet with a LOW balance —
            // without ever touching a real database.
            // ------------------------------------
            const service = new TransferService()
            // jest.spyOn() lets us "watch" a method and replace
            // its real behavior with fake behavior, just for this test.
            //
            // mockResolvedValue() means: "whenever this method is called,
            // pretend it's an async function that resolves to this value"
            jest.spyOn(service, 'getWallet').mockResolvedValue({
                id: 'wallet-123',
                balance: '100', // User only has 100
                currency: 'NGN'
            } as any)

            // ------------------------------------
            // ACT + ASSERT
            // We try to transfer MORE than the wallet has (500 > 100)
            // and expect it to throw an error.
            //
            // .rejects.toThrow() is how Jest checks that an ASYNC
            // function throws an error — regular toThrow() only
            // works for synchronous functions.
            // ------------------------------------
            await expect(
                service.initiateTransfer('user-123', {
                    amount: 500,
                    currency: 'NGN',
                    recipientAccount: '0123456789',
                    bankCode: '000'
                })
            ).rejects.toThrow("Insufficient balance")
        })

        // Test 2
        it('does not call the provider when the balance is insufficient', async () => {
            // ARRANGE
            const service = new TransferService()

            jest.spyOn(service, 'getWallet').mockResolvedValue({
                id: 'wallet-123',
                balance: '100',
                currency: 'NGN'
            } as any)

            // Create a FAKE provider with a fake lookupAccount method.
            // jest.fn() creates a "spy function" — a fake function
            // that records every time it's called, with what arguments.
            const mockProvider = {
                name: 'FakeBank',
                supportedCurrencies: ['NGN'],
                lookupAccount: jest.fn(),
                initiateTransfer: jest.fn()
            }
            mockGetProvider.mockReturnValue(mockProvider as any)

            // ACT
            // We expect this to throw (same as Test 1) — but this
            // time we don't care about the error message.
            // We just need the function to run and fail.
            //
            // try/catch here because we WANT it to throw —
            // we just don't want the test to crash when it does.

            try{
                await service.initiateTransfer('user-123', {
                    amount: 500,
                    currency: 'NGN',
                    recipientAccount: '0123456789',
                    bankCode: '000'
                })
            }catch (error) {
                // Expected - do nothing, we just needed it to throw
            }
            
            // ASSERT
            // The real check of this test:
            // Was lookupAccount ever called on our fake provider?
            //
            // It should NOT have been — because the balance check
            // should fail and stop execution BEFORE we ever
            // try to talk to the bank.
            expect(mockProvider.lookupAccount).not.toHaveBeenCalled()
            expect(mockProvider.initiateTransfer).not.toHaveBeenCalled()
        })
    })
})