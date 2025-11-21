/**
 * Employee API Routes
 * CRUD operations for employees
 */

import { Request, Response, Router } from "express";
import { ZodError } from "zod";
import {
  CreateEmployeeResponse,
  DeleteEmployeeResponse,
  ErrorResponse,
  GetAllEmployeesResponse,
  GetEmployeeResponse,
  UpdateEmployeeResponse,
} from "../models/employee";
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from "../schemas/employee";
import {
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByWallet,
  updateEmployee,
} from "../services/employee";

const router = Router();

/**
 * Format Zod validation errors
 */
function formatZodErrors(error: ZodError<unknown>): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    const key = path || "root";
    if (!formatted[key]) {
      formatted[key] = [];
    }
    formatted[key].push(issue.message);
  });
  return formatted;
}

/**
 * POST /employees
 * Create a new employee
 */
router.post(
  "/employees",
  async (
    req: Request,
    res: Response<CreateEmployeeResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const validationResult = CreateEmployeeSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error);
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors,
        });
        return;
      }

      const employee = await createEmployee(validationResult.data);

      res.status(201).json({
        success: true,
        data: employee,
        message: "Employee created successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error in POST /employees:", errorMessage);
      res.status(500).json({
        success: false,
        error: "Failed to create employee",
        details: { error: [errorMessage] },
      });
    }
  }
);

/**
 * GET /employees
 * Get all employees
 */
router.get(
  "/employees",
  async (
    req: Request,
    res: Response<GetAllEmployeesResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const employees = await getAllEmployees();

      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error in GET /employees:", errorMessage);
      res.status(500).json({
        success: false,
        error: "Failed to fetch employees",
        details: { error: [errorMessage] },
      });
    }
  }
);

/**
 * GET /employees/:id
 * Get employee by ID
 */
router.get(
  "/employees/:id",
  async (
    req: Request,
    res: Response<GetEmployeeResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const employee = await getEmployeeById(id);

      if (!employee) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error in GET /employees/:id:", errorMessage);
      res.status(500).json({
        success: false,
        error: "Failed to fetch employee",
        details: { error: [errorMessage] },
      });
    }
  }
);

/**
 * PATCH /employees/:id
 * Update employee
 */
router.put(
  "/employees/:id",
  async (
    req: Request,
    res: Response<UpdateEmployeeResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validationResult = UpdateEmployeeSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error);
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors,
        });
        return;
      }

      const employee = await updateEmployee(id, validationResult.data);

      res.status(200).json({
        success: true,
        data: employee,
        message: "Employee updated successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("not found")) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        });
        return;
      }
      console.error("Error in PATCH /employees/:id:", errorMessage);
      res.status(500).json({
        success: false,
        error: "Failed to update employee",
        details: { error: [errorMessage] },
      });
    }
  }
);

/**
 * DELETE /employees/:id
 * Delete employee
 */
router.delete(
  "/employees/:id",
  async (
    req: Request,
    res: Response<DeleteEmployeeResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await deleteEmployee(id);

      res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("not found")) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        });
        return;
      }
      console.error("Error in DELETE /employees/:id:", errorMessage);
      res.status(500).json({
        success: false,
        error: "Failed to delete employee",
        details: { error: [errorMessage] },
      });
    }
  }
);

/**
 * GET /employees/wallet/:walletAddress
 * Get employee by wallet address
 */
router.get(
  "/employees/wallet/:walletAddress",
  async (
    req: Request,
    res: Response<GetEmployeeResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      const employee = await getEmployeeByWallet(walletAddress);

      if (!employee) {
        res.status(404).json({
          success: false,
          error: "Employee not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        "Error in GET /employees/wallet/:walletAddress:",
        errorMessage
      );
      res.status(500).json({
        success: false,
        error: "Failed to fetch employee",
        details: { error: [errorMessage] },
      });
    }
  }
);

export default router;
