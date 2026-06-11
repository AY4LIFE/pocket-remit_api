import express from "express";
import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import devLogger from './utils/logger.js'
import {createUsersTable} from "./models/User.js"
import authRoutes from "./routes/auth.routes.js"
import "reflect-metadata";

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes)

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

const start = async() => {
  await createUsersTable()
  logger.info("Users table ready!")


  app.listen(PORT, () => {
    logger.info("Server started!")
    console.log(`Server running on port ${PORT} with link localhost:${PORT}`)
  })
}

start()
export default app;