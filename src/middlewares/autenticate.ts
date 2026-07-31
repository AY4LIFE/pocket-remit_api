import jwt from 'jsonwebtoken'
import type {Request, Response, NextFunction} from 'express'

// --------------------
// This extends Express's Request type to include a user property.
// This is how we fix the (req as any).user hack from the controller.
// Now TypeScript knows req.user exists and what it looks like.
// --------------------
export interface AuthRequest extends Request{
    user?:{
        id: string,
        role: string
    }
}

// --------------------
// This middleware runs BEFORE protected route handlers.
// Its job is to check the token and attach the user to req.
// --------------------
export const autenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // Step 1: Grab the Authorization header
    // It looks like this: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization

    // Check whether the header exists and starts with Bearer
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        res.status(401).json({
            status: 401,
            message: "No token provided"
        })
        return
    }

    // Step 3: Extract just the token part by removing "Bearer " from the start
    // "Bearer abc123" → "abc123"
    const token = authHeader.split(" ")[1]

    if (!token) {
        res.status(401).json({
            status: 401,
            message: "No token provided"
        })
        return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
        res.status(500).json({
            status: 500,
            message: "JWT secret not configured"
        })
        return
    }

    // Step 4: Verify the token using our secret key
    try {
        const decoded = jwt.verify(token, jwtSecret) as unknown

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof (decoded as any).id !== "string" ||
            typeof (decoded as any).role !== "string"
        ) {
            throw new Error("Invalid token payload")
        }

        // We put the decoded user info into req so the next handler can use it
        req.user = {
            id: (decoded as any).id,
            role: (decoded as any).role
        }

        // Everything checks out - move on to the controller
        next()
    } catch {
        res.status(401).json({
            status: 401,
            message: "Invalid token"
        })
    }
}