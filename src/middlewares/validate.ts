import {plainToInstance} from 'class-transformer'
import {validate} from 'class-validator'
import type {Request, Response, NextFunction} from 'express'

// --------------------
// This is a middleware FACTORY.
// You pass it a DTO class, and it gives you back a middleware function.
// That middleware will validate req.body against the DTO rules.
// --------------------

export const validateBody = (DtoClass: any) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        // Step 1: Convert the plain req.body object into an instance of the DTO class
        // This is necessary for the decorators (eg @IsEmail) to work
        const instance = plainToInstance(DtoClass, req.body)

        // Step 2: Run all the validation rules on the instance
        const errors = await validate(instance)

        // Step 3: If there are errors, stop here and send them back
        if (errors.length > 0){
            // Collect all error messages into a clean array
            const messages = errors.map((err) => {
                Object.values(err.constraints)
            }).flat()

            res.status(400).json({
                status: 400,
                message: 'Validation failed',
                errors: messages
            })
            return

        }

        // Step 4: Attach the validated data to req.body and move on
        req.body = instance
        next()
    }
}