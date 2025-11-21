/**
 * SDP (Stellar Disbursement Platform) Service
 * Handles integration with Stellar's disbursement platform for mass employee payments
 */

import axios, { AxiosInstance } from 'axios';
import { SDP_CONFIG } from '../config/constants';

interface EmployeePayment {
  id: string;
  phone: string;
  email?: string;
  amount: string;
  verification?: string;
}

interface CreateDisbursementParams {
  name: string;
  wallet_id: string;
  asset_code: string;
  asset_issuer?: string;
  csv_data: EmployeePayment[];
}

interface DisbursementResponse {
  id: string;
  name: string;
  status: string;
  wallet_id: string;
  created_at: string;
  total_amount: string;
  total_payments: number;
}

class SDPService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SDP_CONFIG.API_URL,
      headers: {
        'Authorization': `Bearer ${SDP_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new disbursement in SDP
   * This registers the employee list and prepares for distribution
   */
  async createDisbursement(params: CreateDisbursementParams): Promise<DisbursementResponse> {
    try {
      const response = await this.client.post('/disbursements', {
        name: params.name,
        wallet_id: params.wallet_id,
        asset: {
          code: params.asset_code,
          issuer: params.asset_issuer,
        },
        receivers: params.csv_data,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating SDP disbursement:', error.response?.data || error.message);
      throw new Error(`Failed to create disbursement: ${error.message}`);
    }
  }

  /**
   * Get disbursement status
   */
  async getDisbursementStatus(disbursementId: string): Promise<DisbursementResponse> {
    try {
      const response = await this.client.get(`/disbursements/${disbursementId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching disbursement status:', error.response?.data || error.message);
      throw new Error(`Failed to get disbursement status: ${error.message}`);
    }
  }

  /**
   * Start disbursement (triggers actual payments)
   * This is called after funds are received in SDP wallet
   */
  async startDisbursement(disbursementId: string): Promise<void> {
    try {
      await this.client.post(`/disbursements/${disbursementId}/start`);
      console.log(`Disbursement ${disbursementId} started successfully`);
    } catch (error: any) {
      console.error('Error starting disbursement:', error.response?.data || error.message);
      throw new Error(`Failed to start disbursement: ${error.message}`);
    }
  }

  /**
   * Get SDP wallet address for receiving funds
   */
  getWalletAddress(): string {
    return SDP_CONFIG.WALLET_ADDRESS;
  }

  /**
   * Parse CSV file to employee payment array
   */
  parseEmployeeCSV(csvContent: string): EmployeePayment[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',');
      return {
        id: `emp_${index + 1}`,
        phone: values[headers.indexOf('phone')] || '',
        email: values[headers.indexOf('email')] || undefined,
        amount: values[headers.indexOf('amount')] || '0',
        verification: values[headers.indexOf('verification')] || undefined,
      };
    });
  }
}

export default new SDPService();
export { EmployeePayment, CreateDisbursementParams, DisbursementResponse };
