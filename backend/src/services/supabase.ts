/**
 * Supabase Service
 * Handles all database operations for payroll tracking, employee records, and SDP uploads
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface PayrollRecord {
  id?: string;
  employer_address: string;
  batch_id: string;
  total_amount: string;
  vault_shares: string;
  lock_date: Date;
  payout_date: Date;
  status: 'locked' | 'released' | 'distributed';
  yield_earned?: string;
  tx_hash_lock: string;
  tx_hash_release?: string;
  created_at?: Date;
}

export interface EmployeeRecord {
  id?: string;
  payroll_id: string;
  stellar_address: string;
  amount: string;
  status: 'pending' | 'sent' | 'claimed';
  created_at?: Date;
}

export interface SDPUploadRecord {
  id?: string;
  payroll_id: string;
  sdp_response: any;
  upload_status: 'pending' | 'success' | 'failed';
  uploaded_at?: Date;
}

class SupabaseService {
  private client: SupabaseClient | null = null;

  /**
   * Initialize Supabase client
   */
  initialize() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️  Supabase credentials not configured. Database features disabled.');
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Create a new payroll record after locking funds
   */
  async createPayroll(payroll: PayrollRecord): Promise<string> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.client
      .from('payrolls')
      .insert([payroll])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to create payroll record:', error);
      throw error;
    }

    console.log(`✅ Payroll record created: ${data.id}`);
    return data.id;
  }

  /**
   * Update payroll status and transaction details
   */
  async updatePayrollStatus(
    payrollId: string,
    updates: {
      status?: 'locked' | 'released' | 'distributed';
      yield_earned?: string;
      tx_hash_release?: string;
    }
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.client
      .from('payrolls')
      .update(updates)
      .eq('id', payrollId);

    if (error) {
      console.error('❌ Failed to update payroll status:', error);
      throw error;
    }

    console.log(`✅ Payroll ${payrollId} updated:`, updates);
  }

  /**
   * Insert employee records from CSV
   */
  async insertEmployees(employees: EmployeeRecord[]): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.client
      .from('employees')
      .insert(employees);

    if (error) {
      console.error('❌ Failed to insert employee records:', error);
      throw error;
    }

    console.log(`✅ Inserted ${employees.length} employee records`);
  }

  /**
   * Get payroll history for an employer
   */
  async getPayrollHistory(employerAddress: string): Promise<PayrollRecord[]> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.client
      .from('payrolls')
      .select('*')
      .eq('employer_address', employerAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to get payroll history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get payroll by batch_id
   */
  async getPayrollByBatchId(
    employerAddress: string,
    batchId: string
  ): Promise<PayrollRecord | null> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.client
      .from('payrolls')
      .select('*')
      .eq('employer_address', employerAddress)
      .eq('batch_id', batchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('❌ Failed to get payroll:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get employees for a specific payroll
   */
  async getEmployeesByPayroll(payrollId: string): Promise<EmployeeRecord[]> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.client
      .from('employees')
      .select('*')
      .eq('payroll_id', payrollId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Failed to get employees:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get payrolls ready for release (payout_date reached, status='locked')
   */
  async getPayrollsReadyForRelease(): Promise<PayrollRecord[]> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('payrolls')
      .select('*')
      .eq('status', 'locked')
      .lte('payout_date', now);

    if (error) {
      console.error('❌ Failed to get payrolls ready for release:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create SDP upload record
   */
  async createSDPUpload(upload: SDPUploadRecord): Promise<string> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.client
      .from('sdp_uploads')
      .insert([upload])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to create SDP upload record:', error);
      throw error;
    }

    console.log(`✅ SDP upload record created: ${data.id}`);
    return data.id;
  }

  /**
   * Update SDP upload status
   */
  async updateSDPUploadStatus(
    uploadId: string,
    status: 'pending' | 'success' | 'failed',
    sdpResponse?: any
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const updates: any = { upload_status: status };
    if (sdpResponse) {
      updates.sdp_response = sdpResponse;
    }

    const { error } = await this.client
      .from('sdp_uploads')
      .update(updates)
      .eq('id', uploadId);

    if (error) {
      console.error('❌ Failed to update SDP upload status:', error);
      throw error;
    }

    console.log(`✅ SDP upload ${uploadId} status: ${status}`);
  }

  /**
   * Update employee status
   */
  async updateEmployeeStatus(
    employeeId: string,
    status: 'pending' | 'sent' | 'claimed'
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.client
      .from('employees')
      .update({ status })
      .eq('id', employeeId);

    if (error) {
      console.error('❌ Failed to update employee status:', error);
      throw error;
    }
  }
}

// Export singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;
