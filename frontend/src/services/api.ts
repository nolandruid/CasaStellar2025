/**
 * API Service
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Types
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Employer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  salary: number;
  walletAddress: string;
  department?: string;
  employerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  salary: number;
  walletAddress: string;
  department?: string;
  employerId?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  salary?: number;
  walletAddress?: string;
  department?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    employer: Employer;
    token: string;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Authentication API
export const authAPI = {
  /**
   * Register a new employer
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  },

  /**
   * Login an employer
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  /**
   * Get current employer profile
   */
  async getProfile(): Promise<ApiResponse<Employer>> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile');
    }

    return response.json();
  },
};

// Employees API
export const employeesAPI = {
  /**
   * Get all employees
   */
  async getAll(): Promise<ApiResponse<Employee[]>> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch employees');
    }

    return response.json();
  },

  /**
   * Get employee by ID
   */
  async getById(id: string): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch employee');
    }

    return response.json();
  },

  /**
   * Create a new employee
   */
  async create(data: CreateEmployeeData): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create employee');
    }

    return response.json();
  },

  /**
   * Update an employee
   */
  async update(id: string, data: UpdateEmployeeData): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update employee');
    }

    return response.json();
  },

  /**
   * Delete an employee
   */
  async delete(id: string): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete employee');
    }

    return response.json();
  },

  /**
   * Get employee by wallet address
   */
  async getByWallet(walletAddress: string): Promise<ApiResponse<Employee>> {
    const response = await fetch(`${API_BASE_URL}/employees/wallet/${walletAddress}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch employee');
    }

    return response.json();
  },
};

// Payroll API
export interface EmployeePayrollData {
  id: string;
  name: string;
  walletAddress: string;
  amount: string;
}

export interface UploadPayrollData {
  employerAddress: string;
  employees: EmployeePayrollData[];
  payoutDate: number | string; // Unix timestamp or ISO date string
}

export interface PayrollStatus {
  employer: string;
  total_amount: string;
  vault_shares: string;
  lock_date: number;
  payout_date: number;
  yield_earned: string;
  funds_released: boolean;
  yield_claimed: boolean;
  tx_hash_lock?: string;
  tx_hash_release?: string;
}

export interface UploadPayrollResponse {
  success: boolean;
  message: string;
  payrollId: string;
  batchId?: string;
  employeeCount: number;
  status: string;
  timestamp: string;
  txHash?: string;
  totalAmount?: string;
}

export interface YieldData {
  currentYield: string;
  elapsedTime: number;
  lockDate: number;
  payoutDate: number;
}

export const payrollAPI = {
  /**
   * Upload payroll batch
   */
  async uploadPayroll(data: UploadPayrollData): Promise<UploadPayrollResponse> {
    const response = await fetch(`${API_BASE_URL}/uploadPayroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload payroll');
    }

    return response.json();
  },

  /**
   * Get payroll status
   */
  async getStatus(employerAddress: string, batchId: string): Promise<ApiResponse<PayrollStatus>> {
    const response = await fetch(
      `${API_BASE_URL}/getStatus?employerAddress=${encodeURIComponent(employerAddress)}&batchId=${encodeURIComponent(batchId)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get payroll status');
    }

    return response.json();
  },

  /**
   * Calculate current yield (real-time)
   */
  async calculateCurrentYield(employerAddress: string, batchId: string): Promise<ApiResponse<YieldData>> {
    const response = await fetch(
      `${API_BASE_URL}/calculateYield?employerAddress=${encodeURIComponent(employerAddress)}&batchId=${encodeURIComponent(batchId)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate yield');
    }

    return response.json();
  },

  /**
   * Release payroll to SDP
   */
  async releasePayroll(employerAddress: string, batchId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/releasePayroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employerAddress, batchId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to release payroll');
    }

    return response.json();
  },
};
