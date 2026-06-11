import {Router} from 'express'
import {register, login, me} from "../controllers/auth.controller.js"
import {validateBody} from "../middlewares/validate.js"
import {autenticate} from "../middlewares/autenticate.js"
import {RegisterDto, LoginDto} from "../dto/auth.dto.js"

const router = Router()

// --------------------
// POST /auth/register
// validateBody(RegisterDto) runs FIRST — checks the incoming data
// register controller runs SECOND — actually creates the user
// --------------------
router.post("/register", validateBody(RegisterDto), register)


// --------------------
// POST /auth/login
// validateBody(LoginDto) runs FIRST — checks the incoming data
// login controller runs SECOND — checks credentials and returns token
// --------------------
router.post("/login", validateBody(LoginDto), login)


// --------------------
// GET /auth/me
// autenticate runs FIRST — checks the token and attaches req.user
// me controller runs SECOND — fetches and returns the user profile
// --------------------
router.get("/me", autenticate, me)


export default router