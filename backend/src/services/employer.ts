/**
 * Employer Service
 * Handles all database operations for employers
 */

import { Employer as PrismaEmployer } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

export type Employer = PrismaEmployer;

export interface RegisterEmployerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

export interface UpdateEmployerInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface EmployerWithoutPassword extends Omit<Employer, "password"> {}

/**
 * Register a new employer with hashed password
 */
export async function registerEmployer(
  data: RegisterEmployerInput
): Promise<EmployerWithoutPassword> {
  // Hash the password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create employer
  const employer = await prisma.employer.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  // Remove password from response
  const { password, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}

/**
 * Get employer by email
 */
export async function getEmployerByEmail(email: string): Promise<Employer | null> {
  return prisma.employer.findUnique({
    where: { email },
  });
}

/**
 * Get employer by ID (without password)
 */
export async function getEmployerById(id: string): Promise<EmployerWithoutPassword | null> {
  const employer = await prisma.employer.findUnique({
    where: { id },
  });

  if (!employer) return null;

  const { password, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}

/**
 * Get all employers (without passwords)
 */
export async function getAllEmployers(): Promise<EmployerWithoutPassword[]> {
  const employers = await prisma.employer.findMany();

  return employers.map(({ password, ...employer }) => employer);
}

/**
 * Update employer
 */
export async function updateEmployer(
  id: string,
  data: UpdateEmployerInput
): Promise<EmployerWithoutPassword> {
  // If password is being updated, hash it
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const employer = await prisma.employer.update({
    where: { id },
    data,
  });

  const { password, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}

/**
 * Delete employer
 */
export async function deleteEmployer(id: string): Promise<EmployerWithoutPassword> {
  const employer = await prisma.employer.delete({
    where: { id },
  });

  const { password, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}

/**
 * Verify employer password
 */
export async function verifyEmployerPassword(
  email: string,
  password: string
): Promise<EmployerWithoutPassword | null> {
  const employer = await getEmployerByEmail(email);

  if (!employer) return null;

  const isValid = await bcrypt.compare(password, employer.password);

  if (!isValid) return null;

  const { password: _, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}

/**
 * Get employer with their employees
 */
export async function getEmployerWithEmployees(id: string) {
  const employer = await prisma.employer.findUnique({
    where: { id },
    include: {
      employees: true,
    },
  });

  if (!employer) return null;

  const { password, ...employerWithoutPassword } = employer;
  return employerWithoutPassword;
}
