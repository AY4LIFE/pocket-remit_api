import type {Response, NextFunction} from 'express'
import type {AuthRequest} from "../middlewares/autenticate.js"
import {TransferService} from '../services/transfer.services.js'
import {plainToInstance} from 'class-transformer'
import {validate} from 'class-validator'
import {InitiateTransferDto} from '../dto/transfer.dto.js'

const transferService = new TransferService()

// ------------------------------------
// INITIATETRANSFER
// Handles: POST /transfers
//
// This is what runs when a user wants to send money.
// It validates the request body, calls the service,
// and returns the transaction record as a receipt.
// ------------------------------------
export const initiateTransfer = async(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try{
    // ------------------------------------
    // STEP 1 — TRANSFORM THE REQUEST BODY INTO A DTO
    // plainToInstance() converts the raw request body object
    // into an actual InitiateTransferDto instance so that
    // class-validator decorators (@IsNumber, @IsString etc.)
    // can run against it
    // ------------------------------------
    const dto = plainToInstance(InitiateTransferDto, req.body)

    // ------------------------------------
    // STEP 2 — VALIDATE THE DTO
    // validate() runs all the decorators we wrote in transfer.dto.ts
    // If anything fails (wrong type, missing field etc.)
    // we return a 400 Bad Request immediately
    // ------------------------------------
    const errors = await validate(dto)
    if (errors.length > 0){
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.map(e => Object.values(e.constraints || {})).flat()
        })
    }

    //  Step 3: Get the logged in user's id
    const userId = req.user!.id

    // Step 4: Call the service
    const transaction = await transferService.initiateTransfer(userId, dto)

    // ------------------------------------
    // STEP 5 — RETURN THE RESPONSE
    // 201 Created — because a new transaction record was created
    // This is the "receipt" the user sees after sending money
    // ------------------------------------
    return res.status(201).json({
        success: true,
        message: 'Transfer initiated successfully',
        data: transaction
    })
    } catch(error: any){
        next(error)
    }
}

// GET TRANSACTIONS
// Handles GET /transfers

export const getTransaction = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user!.id

    // ------------------------------------
    // PARSE PAGINATION PARAMS FROM THE URL
    // e.g. GET /transfers?page=2&limit=10
    //
    // Number() converts the string "2" to the number 2
    // We provide defaults in case the user doesn't send them:
    //   page defaults to 1 (first page)
    //   limit defaults to 10 (10 transactions per page)
    // ------------------------------------
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const result = await transferService.getTransaction(userId, page, limit)

    return res.status(200).json({
        success: true,
        message: 'Transaction fetched successfully',
        ...result
    })
    }catch(error){
        next(error)
    }
}

// GET Transactions by id
// Handles GET /transfers/:id

export const getTransactionById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        const userId = req.user!.id
        const transactionId = req.params.id
        const transaction = await transferService.getTransactionById(
            userId,
            transactionId as string
        )

        return res.status(200).json({
            success: true,
            message: 'Transaction fetched successfully',
            data: transaction
        })
    }catch(error){
        next(error)
    }
}

// ------------------------------------
// REFRESHSTATUS
// Handles: GET /transfers/:id/status
//
// For GlobalBank transfers that start as 'pending',
// the user can hit this endpoint to check if their
// international transfer has settled yet.
// ------------------------------------
export const refreshStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        const userId = req.user!.id
        const transactionId = req.params.id

        const transaction = await transferService.refreshStatus(
            userId, transactionId as string
        )

        return res.status(200).json({
            success: true,
            message: 'Status refreshed successfully',
            data: {
                id: transaction.id,
                status: transaction.status,
                providerReference: transaction.providerReference
            }
        })

    }catch(error){
        next(error)
    }
}