import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";


dotenv.config(); // loads your .env file

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Life Is Good");
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Life Is Really Good",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;