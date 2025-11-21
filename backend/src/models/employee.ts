/**
 * Employee Response Models
 * Type-safe response structures for API endpoints
 */

import { Employee } from "../services/employee";

export interface CreateEmployeeResponse {
  success: boolean;
  data: Employee;
  message: string;
}

export interface GetEmployeeResponse {
  success: boolean;
  data: Employee;
}

export interface GetAllEmployeesResponse {
  success: boolean;
  data: Employee[];
}

export interface UpdateEmployeeResponse {
  success: boolean;
  data: Employee;
  message: string;
}

export interface DeleteEmployeeResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  details?: Record<string, string[]>;
}
