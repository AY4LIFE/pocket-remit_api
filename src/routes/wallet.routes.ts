import {Router} from "express"
import{
    listWallets,
    createWallet,
    getBalance
} from "../controllers/wallet.controller.js"
import {autenticate} from "../middlewares/autenticate.js"
import {validateBody} from "../middlewares/validate.js"
import {createWalletDto} from "../dto/wallet.dto.js"

const router = Router()

// --------------------
// ALL wallet routes are protected — you must be logged in.
// Instead of adding authenticate to every single route,
// we can use router.use() to apply it to ALL routes in this file.
// --------------------
router.use(autenticate)

// GET /wallets - list all my wallets
router.get("/", listWallets)

// POST /wallets - create a new wallet
// validateBody checks the currency is valid before hitting the controller
router.post("/", validateBody(createWalletDto), createWallet)


// GET /wallets/:id/balance - get balance of a specific wallet
router.get("/:id/balance", getBalance)

export default router