import {AppDataSource} from "../config/database.js"
import {Wallet} from "../models/Wallet.js"


// --------------------
// This is our wallet repository — the ONLY place
// in the entire codebase that talks to the wallet table.
// The service will call these functions, never the DB directly.
// --------------------

 const walletRepository = AppDataSource.getRepository(Wallet)

// Find all wallets that belong to a specific user used in GET /wallets
export const findWalletsByUserID = async (userId: string): Promise<Wallet[]> => {
    return walletRepository.find({
        where: {user: {id: userId}}
    })
}

// Find a specific wallet by its id
// Used in GET /wallets/:id/balance
export const findWalletById = async (id: string): Promise<Wallet | null> => {
    return walletRepository.findOne({
        where: {id}
    })
}

// Find a wallet by user and currency
// Used to check if a user already had a wallet for that currency
// before creating a new one
export const findWalletByUserAndCurrency = async (
    userId: string,
    currency: string
): Promise<Wallet | null> => {
    return walletRepository.findOne({
        where: {user: {id: userId}, currency}
    })
}

// Create and save a new wallet for a user
// Used in POST /wallets
export const createWallet = async (
    userId: string,
    currency: string
): Promise<Wallet> => {
    const wallet = walletRepository.create({
        user: {id: userId},
        currency: currency.toUpperCase()
    })
    return walletRepository.save(wallet)
}