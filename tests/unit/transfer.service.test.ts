import {TransferService} from '../../src/services/transfer.services.js'
import { describe, it, expect, jest } from '@jest/globals'
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
    })
})