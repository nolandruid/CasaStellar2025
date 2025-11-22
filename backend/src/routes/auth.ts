/**
 * Authentication Routes
 * Handles employer registration and login
 */

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  RegisterEmployerSchema,
  LoginEmployerSchema,
} from "../schemas/employer";
import {
  registerEmployer,
  verifyEmployerPassword,
  getEmployerById,
} from "../services/employer";

const router = Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

/**
 * POST /auth/register
 * Register a new employer
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = RegisterEmployerSchema.parse(req.body);

    // Register employer
    const employer = await registerEmployer(validatedData);

    // Generate JWT token
    const token = jwt.sign(
      { id: employer.id, email: employer.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        employer,
        token,
      },
      message: "Employer registered successfully",
    });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    // Handle unique constraint violation (duplicate email)
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    console.error("Error registering employer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register employer",
    });
  }
});

/**
 * POST /auth/login
 * Login an employer
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = LoginEmployerSchema.parse(req.body);

    // Verify credentials
    const employer = await verifyEmployerPassword(
      validatedData.email,
      validatedData.password
    );

    if (!employer) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: employer.id, email: employer.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      data: {
        employer,
        token,
      },
      message: "Login successful",
    });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
});

/**
 * GET /auth/me
 * Get current employer profile (requires authentication)
 */
router.get("/me", async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    // Get employer
    const employer = await getEmployerById(decoded.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: "Employer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: employer,
    });
  } catch (error) {
    console.error("Error getting employer profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get employer profile",
    });
  }
});

export default router;
