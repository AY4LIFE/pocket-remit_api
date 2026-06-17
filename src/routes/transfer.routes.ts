import {Router} from 'express'
import {autenticate} from '../middlewares/autenticate.js'
import {
    initiateTransfer,
    getTransaction,
    getTransactionById,
    refreshStatus
} from '../controllers/transfer.controller.js'

const router = Router()

// All transfer routes are protected — must be logged in
router.use(autenticate)

router.post('/', initiateTransfer)
router.get('/', getTransaction)
router.get('/:id', getTransactionById)
router.get('/:id/status', refreshStatus)

export default router