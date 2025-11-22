/**
 * Main Express Server
 * Payroll System with Stellar/Soroban Integration
 */

import { rpc } from "@stellar/stellar-sdk";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import express, { Express, NextFunction, Request, Response } from "express";

import { SERVER_CONFIG } from "./config/constants";
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  setupProcessErrorHandlers,
} from "./middleware/logging";
import logger from "./utils/logger";
import { startCron, stopCron } from "./services/cron";
// import authRoutes from "./routes/auth"; // Disabled - uses Prisma
// import employeeRoutes from "./routes/employee"; // Disabled - uses Prisma
import payrollRoutes from "./routes/payroll";
import {
  checkSorobanHealth,
  initializeSorobanServer,
} from "./services/stellar";
import supabaseService from "./services/supabase";

// Initialize Express app
const app: Express = express();

// Extend Express app locals to include sorobanServer
declare global {
  namespace Express {
    interface Application {
      locals: {
        sorobanServer?: rpc.Server;
      };
    }
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Initialize Soroban connection
let sorobanServer: rpc.Server | null = null;

/**
 * Initialize Soroban Server on startup
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info("Initializing Payroll Backend Server...");

    // Initialize Supabase
    supabaseService.initialize();
    logger.info("Supabase initialized");

    // Connect to Soroban
    sorobanServer = initializeSorobanServer();
    logger.info("Soroban server initialized");

    // Check health
    await checkSorobanHealth(sorobanServer);
    logger.info("Soroban health check passed");

    // Make sorobanServer available in app locals
    app.locals.sorobanServer = sorobanServer;

    logger.info("App initialization complete");
  } catch (error) {
    logger.error("Failed to initialize app", error as Error);
    process.exit(1);
  }
}

// Routes
// app.use("/auth", authRoutes); // Disabled - uses Prisma
app.use("/", payrollRoutes);
// app.use("/", employeeRoutes); // Disabled - uses Prisma

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

/**
 * Start Server
 */
async function startServer(): Promise<void> {
  try {
    // Setup process error handlers
    setupProcessErrorHandlers();

    // Initialize app dependencies
    await initializeApp();

    // Start listening
    app.listen(SERVER_CONFIG.PORT, (): void => {
      logger.info(`Server running on http://localhost:${SERVER_CONFIG.PORT}`, {
        port: SERVER_CONFIG.PORT,
        environment: process.env.NODE_ENV || 'development',
      });

      // Start cron job for automatic payroll releases
      startCron();
    });
  } catch (error) {
    logger.error("Failed to start server", error as Error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on("SIGTERM", (): void => {
  logger.info("SIGTERM signal received: closing HTTP server");
  stopCron();
  process.exit(0);
});

process.on("SIGINT", (): void => {
  logger.info("SIGINT signal received: closing HTTP server");
  stopCron();
  process.exit(0);
});

export default app;
