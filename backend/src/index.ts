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
import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employee";
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

// Initialize Soroban connection
let sorobanServer: rpc.Server | null = null;

/**
 * Initialize Soroban Server on startup
 */
async function initializeApp(): Promise<void> {
  try {
    console.log("🚀 Initializing Payroll Backend Server...\n");

    // Initialize Supabase
    supabaseService.initialize();

    // Connect to Soroban
    sorobanServer = initializeSorobanServer();

    // Check health
    await checkSorobanHealth(sorobanServer);

    // Make sorobanServer available in app locals
    app.locals.sorobanServer = sorobanServer;

    console.log("✓ App initialization complete\n");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("✗ Failed to initialize app:", errorMessage);
    process.exit(1);
  }
}

// Routes
app.use("/auth", authRoutes);
app.use("/", payrollRoutes);
app.use("/", employeeRoutes);

/**
 * 404 Handler
 */
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

/**
 * Error Handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error("Server Error:", err.message);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

/**
 * Start Server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize app dependencies
    await initializeApp();

    // Start listening
    app.listen(SERVER_CONFIG.PORT, (): void => {
      console.log(`
✨ Server running on http://localhost:${SERVER_CONFIG.PORT}
      `);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to start server:", errorMessage);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on("SIGTERM", (): void => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", (): void => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

export default app;
