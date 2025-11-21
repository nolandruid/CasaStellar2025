/**
 * Employee Service
 * Handles all database operations for employees
 */

import { Employee as PrismaEmployee } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type Employee = PrismaEmployee;

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  salary: number;
  walletAddress: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  salary?: number;
  walletAddress?: string;
}

/**
 * Create a new employee
 */
export async function createEmployee(data: CreateEmployeeInput) {
  return prisma.employee.create({
    data,
  });
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({
    where: { id },
  });
}

/**
 * Get all employees
 */
export async function getAllEmployees() {
  return prisma.employee.findMany();
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  return prisma.employee.update({
    where: { id },
    data,
  });
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: string) {
  return prisma.employee.delete({
    where: { id },
  });
}

/**
 * Get employee by wallet address
 */
export async function getEmployeeByWallet(walletAddress: string) {
  return prisma.employee.findFirst({
    where: { walletAddress },
  });
}
