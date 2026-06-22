import express from "express";
import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import devLogger from './utils/logger.js'
import authRoutes from "./routes/auth.routes.js"
import helmet from "helmet"
import {rateLimit} from 'express-rate-limit'
import "reflect-metadata";
import { AppDataSource } from "./config/database.js"
import walletRoutes from "./routes/wallet.routes.js"
import transferRoutes from './routes/transfer.routes.js'
import {connectRedis} from './config/redis.js'
import fxRoutes from './routes/fx.routes.js'

interface HealthResponseBody {
  status: string;
  message: string;
}

interface ErrorBody {
  status?: number;
  message?: string;
}

interface AppError extends Error {
  status?: number;
}

const logger = devLogger()

//logger.debug("Debugging something")
//logger.error("Something broke")
dotenv.config(); // loads your .env file

const app = express();

// Helmet must be the first middleware registered
// It sets 13 security HTTP headers automatically
app.use(helmet())

// Global Rate Limiter
// Applies to all routes - a basic safety net
// 100 requests per 15 minutes per IP address
// Protects against general API abuse and DDoS

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,  // sends RateLimit headers in response
  legacyHeaders: false    // disables old X-RateLimit headers
})
app.use(globalLimiter)

// ------------------------------------
// AUTH RATE LIMITER
// Much stricter — applied ONLY to /auth routes.
// Why stricter? Because /auth/login is the main
// target for brute force attacks.
//
// 5 attempts per 15 minutes per IP.
// After 5 failed logins, the attacker is blocked.
// ------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 15 minutes time'
  },
  standardHeaders: true,
  legacyHeaders: true,
  // SKIP SUCCESSFUL REQUESTS
  // Only COUNT failed attempts toward the limit.
  // A real user logging in successfully doesn't
  // get penalised — only failed attempts stack up.
  skipSuccessfulRequests: true
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authLimiter, authRoutes) // authLimiter added
app.use("/wallets", walletRoutes)
app.use("/transfers", transferRoutes)
app.use('/fx', fxRoutes)

app.get("/", (req: Request, res: Response<string>) => {
  res.send("Life Is Good");
});

app.get("/health", (req: Request, res: Response<HealthResponseBody>) => {
  res.status(200).json({
    status: "ok",
    message: "Life Is Really Good",
  });
});


app.all("/{*path}", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on the server`) as AppError;
  err.status = 404;
  next(err); // passes the error down to the global error handler below
});

const errorHandler: ErrorRequestHandler = (error: AppError, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Internal server error";

  logger.error(`[${status}] ${message}`); // log every error

  res.status(status).json({
    status,
    message,
  });
};

app.use(errorHandler);


const PORT: string | number = process.env.PORT || 3000;

const start = async () => {
  await AppDataSource.initialize();
  logger.info("Database connected!");

  await connectRedis()
  logger.info("Redis connected!")

  app.listen(PORT, () => {
    logger.info("Server started!");
    console.log(`Server running on port ${PORT}`);
  });
};

start()
export default app;