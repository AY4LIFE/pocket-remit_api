import {Router} from 'express'
import {getRate, convert} from '../controllers/fx.controller.js'
import {autenticate} from '../middlewares/autenticate.js'

const router = Router()

// All FX routes are protected - must be logged in
router.use(autenticate)

// GET /fx/rate?from=*&to=*
router.get('/rate', getRate)

// GET /fx/convert?from=*&to=*&amount=*
router.get('/convert', convert)

export default router