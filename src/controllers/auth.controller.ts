import type {Request, Response, NextFunction} from "express"
import {registerUser, loginUser, getMe} from "../services/auth.services.js"


// Handles POST/auth/register
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        // req.body has already been validated by our DTO middleware
        // so we can trust the shape of the data here
        const {email, password, full_name} = req.body
        const result = await registerUser(email, password, full_name)

        res.status(201).json({
            status: 201,
            message: "Account created successfully",
            data: result
        })
    }catch(error){
        // We don't handle the error here — we pass it to the global error handler
        // This is what next(error) does — it skips to the error handler in app.ts
        next(error)
    }
}

// Handles POST /auth/login
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const {email, password} = req.body
        const result = await loginUser(email, password)

        res.status(200).json({
            status: 200,
            message: "Login successful",
            data: result
        })
    }catch (error){
        next(error)
    }
}

// Handles GET /auth/me
// This route is protected — only logged in users can access it
// The authenticate middleware will attach req.user before this runs
export const me = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // req.user is attached by the authenticate middleware
        // It contains the decoded JWT payload — { id, role }
        const userId = (req as any).user.id

        const user = await getMe(userId)

        res.status(200).json({
            status: 200,
            message: "Profile fetched successfully",
            data: user
        })
    }catch(error){
        next(error)
    }
}
