import type {Request, Response, NextFunction} from 'express'
import {FxService} from '../services/fx.services.js'

const fxService = new FxService()

/*
GETRATE
Handles: GET /fx/rate?from=*&to=*
Returns the exchange rate between two currencies
*/
export const getRate = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        // Read query parameters
        const from = (req.query.from as string)?.toUpperCase()
        const to = (req.query.to as string)?.toUpperCase()

        // ------------------------------------
        // VALIDATE
        // Both currencies are required — if either is missing
        // return 400 immediately before calling the service
        // ------------------------------------
        if (!from || !to){
            return res.status(400).json({
                success: false,
                message: "Both 'from' and 'to' currency codes are required"
            })
        }

        // Same currency? No need to call Redis
        // The answer is 1
        if (from === to){
            return res.status(200).json({
                success: true,
                data: {from,to, rate: 1}
            })
        }
        const rate = await fxService.getRate(from, to)
        return res.status(200).json({
            success: true,
            data: {from, to, rate}
        })
    }catch(error){
        next(error)
    }
}


/*
CONVERT
Handles: GET /fx/convert?from=*&to=*&amount=*
Convert an amount from one currency to another
*/

export const convert = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const from = (req.query.from as string)?.toUpperCase()
        const to = (req.query.to as string)?.toUpperCase()
        const amount = Number(req.query.amount)

        // ------------------------------------
        // VALIDATE
        // All three fields are required.
        // Also check amount is a valid positive number —
        // Number('abc') returns NaN, Number('') returns 0
        // both of which we want to reject
        // ------------------------------------
        if (!from || !to){
            return res.status(400).json({
                success: false,
                message: "Both 'from' and 'to' currency codes are rerquired"
            })
        }

        if (!amount || isNaN(amount) || amount <= 0){
            return res.status(400).json({
                success: false,
                message: 'A valid positive amount is required'
            })
        }

        // Same currency - no conversion needed
        if (from === to){
            return res.status(200).json({
                success: true,
                data: {from, to, amount, rate: 1, result: amount}
            })
        }
        const result = fxService.convert(from, to, amount)

        return res.status(200).json({
            success: true,
            data: result
        })
    }catch(error) {
        next(error)
    }
}