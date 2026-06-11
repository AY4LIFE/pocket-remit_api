import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {createUser, findUserEmail, findUserById} from'../models/User.js'
import type {User} from '../models/User.js'


// --------------------
// The shape of the data we return after login/register.
// We return the user AND a token together.
// --------------------
interface AuthResponse {
    user: Omit<User, "password_hash"> // Omit means "everything except a particular field"
    token: string
}

// --------------------
// A helper function that creates a JWT token for a user.
// We'll reuse this in both register and login.
// --------------------
const generateToken = (user: User): string => {
    // jwt.sign() creates the token.
    // We put the user's id and role INSIDE the token (this is the "payload").
    // The secret key is used to sign it — only our server knows this key.
    // expiresIn means the token stops working after 24 hours.

    return jwt.sign(
        {id: user.id, role: user.role},
        process.env.JWT_SECRET as string,
        {expiresIn: "24h"}
    )
}

// --------------------
// Handles registering a new user.
// Steps: check email isn't taken → create user → generate token → return both
// --------------------
export const registerUser = async(
    email: string,
    password: string,
    full_name: string
): Promise<AuthResponse> => {

    // Step 1: Check if someone has the email
    const existingUser = await findUserEmail(email)
    if (existingUser){
        // We throw an error with a status so our global error handler catches it
        const error = new Error("Email already in use") as any
        error.status = 409
        throw error
    }

    // Step 2: Create a user in the database
    // Notice: the password hashing happens inside createUser in our model
    const user = await createUser({email, password, full_name})

    // Step 3: Generate a token for the new user
    const token = generateToken(user)

    // Step 4: Return the user and token
    // Manually remove password_hash before sending back

    const {password_hash, ...userWithoutPassword} = user
    return {user: userWithoutPassword, token}
}


// --------------------
// Handles logging in an existing user.
// Steps: find user → check password → generate token → return both
// --------------------
export const loginUser = async(
    email: string,
    password: string
): Promise<AuthResponse> => {

    // Step 1: Find the user by email
    const user = await findUserEmail(email)
    if (!user){
        // We use a vague message on purpose — we don't want to reveal
        // whether the email exists or not (security best practice)
        const error = new Error("Invalid email") as any
        error.status = 401 // 401 means "Unauthorized"
        throw error
    }

    // Step 2: Compare the plain password they sent with the hashed one in the DB
    // bcrypt.compare() hashes the plain password and checks if it matches
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch){
        const error = new Error("Invalid password") as any
        error.status = 401
        throw error
    }

    // Step 3: Generate a token
    const token = generateToken(user)

    // Step 4: Return user and token
    const {password_hash, ...userWithoutPassword} = user
    return {user: userWithoutPassword, token}
}


    // --------------------
    // Gets the current logged-in user's profile.
    // We'll use this in the /auth/me route.
    // --------------------
    export const getMe = async (userId: string): Promise<Omit<User, "password_hash">> => {
        const user = await findUserById(userId)
        if (!user){
            const error = new Error("User not found") as any
            error.status = 404
            throw error
        }
        return user
    }