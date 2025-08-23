import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import logger from "./utils/logger"; 

import { errorHandler } from "./middlewares/errorHandler";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(
  morgan(":method :url :status - :response-time ms", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;

  // MongoDB connection states
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  logger.info("Health check endpoint was called ✅");
  res.status(200).json({
    status: "ok",
    server: "running",
    database: states[dbState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
