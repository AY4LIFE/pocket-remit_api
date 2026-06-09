import express from "express";
import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import devLogger from './utils/logger.js'

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

app.get("/", (req: Request, res: Response<string>) => {
  res.send("Life Is Good");
});

app.get("/health", (req: Request, res: Response<HealthResponseBody>) => {
  res.status(200).json({
    status: "ok",
    message: "Life Is Really Good",
  });
});


app.all('*', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on the server`) as AppError
    err.status = 404
    next(err)
})

const errorHandler: ErrorRequestHandler = ((error: AppError, req: Request, res: Response, next: NextFunction) => {
    error.status = error.status || 500;
    error.message = error.message || 'error'
    logger.error(`[${error.status}] ${error.message}`)

    res.status(error.status).json({
        status: error.status,
        message: error.message
    })

app.use(errorHandler)
})

const PORT: string | number = process.env.PORT || 3000;


app.listen(PORT, () => {
    logger.info("Server started!")
    console.log(`Server running on port ${PORT}`);
});

export default app;