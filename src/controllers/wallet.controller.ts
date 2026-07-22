import type {Response, NextFunction} from "express"
import type {AuthRequest} from "../middlewares/autenticate.js"
import {
    getUserWallets,
    createUserWallet,
    getWalletBalance
} from "../services/wallet.service.js"


// We are using AuthRequest
// which is our custom type that includes req.user
// because all wallet routes are protected


// Handles GET /wallets
// Returns all wallets belonging to the logged in user

export const listWallets = async(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        const userId = req.user!.id
        const wallets = await getUserWallets(userId)

        res.status(200).json({
            status: 200,
            message: "Wallets fetched successfully",
            data: wallets
        })
    } catch (error){
        next(error)
    }
}

// Handles POST /wallets
// Creates a new wallet for the logged in user

export const createWallet = async(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        const userId = req.user!.id
        const {currency} = req.body

        const wallet = await createUserWallet(userId, currency)

        res.status(201).json({
            status: 201,
            message: "Wallet created successfully",
            data: wallet,
        })
    }catch(error){
        next(error)
    }
}

// Handles GET /wallets/:id/balance
// Returns the balance of a specific wallet

export const getBalance = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        const userId = req.user!.id

        // req.params.id comes from the URL
        const walletId = req.params["id"] as string
        const balance = await getWalletBalance(walletId, userId)

        res.status(200).json({
            status: 200,
            message: "Balance fethced successfully",
            data: balance
        })
    }catch(error){
        next(error)
    }
}