-- CasaStellar PayDay Supabase Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Create enum types
CREATE TYPE payroll_status AS ENUM ('locked', 'released', 'distributed');
CREATE TYPE employee_status AS ENUM ('pending', 'sent', 'claimed');
CREATE TYPE upload_status AS ENUM ('pending', 'success', 'failed');

-- Table 1: Payrolls
-- Tracks each payroll batch locked in the smart contract
CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_address TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    vault_shares NUMERIC NOT NULL,
    lock_date TIMESTAMPTZ NOT NULL,
    payout_date TIMESTAMPTZ NOT NULL,
    status payroll_status NOT NULL DEFAULT 'locked',
    yield_earned NUMERIC,
    tx_hash_lock TEXT NOT NULL,
    tx_hash_release TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique batch_id per employer
    UNIQUE(employer_address, batch_id)
);

-- Index for querying by employer
CREATE INDEX idx_payrolls_employer ON payrolls(employer_address);

-- Index for finding payrolls ready for release
CREATE INDEX idx_payrolls_ready_for_release ON payrolls(status, payout_date);

-- Table 2: Employees
-- Tracks individual employee payments from CSV uploads
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    stellar_address TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status employee_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying employees by payroll
CREATE INDEX idx_employees_payroll ON employees(payroll_id);

-- Index for querying by stellar address (to see payment history)
CREATE INDEX idx_employees_stellar_address ON employees(stellar_address);

-- Table 3: SDP Uploads
-- Tracks uploads to Stellar Disbursement Platform
CREATE TABLE sdp_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    sdp_response JSONB,
    upload_status upload_status NOT NULL DEFAULT 'pending',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying uploads by payroll
CREATE INDEX idx_sdp_uploads_payroll ON sdp_uploads(payroll_id);

-- Add Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdp_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow backend service to do everything (using service role key)
-- For anon key access, you can add more restrictive policies later

-- For now, allow all operations with service role
-- (In production, you'd use service_role key in backend, not anon key)

-- Allow read access to payrolls for the employer
CREATE POLICY "Employers can view their own payrolls"
    ON payrolls FOR SELECT
    USING (true); -- Adjust this based on your auth strategy

-- Allow backend to insert/update
CREATE POLICY "Backend can manage payrolls"
    ON payrolls FOR ALL
    USING (true);

CREATE POLICY "Backend can manage employees"
    ON employees FOR ALL
    USING (true);

CREATE POLICY "Backend can manage sdp_uploads"
    ON sdp_uploads FOR ALL
    USING (true);

-- Optional: Create a view for payroll summary
CREATE VIEW payroll_summary AS
SELECT 
    p.id,
    p.employer_address,
    p.batch_id,
    p.total_amount,
    p.vault_shares,
    p.lock_date,
    p.payout_date,
    p.status,
    p.yield_earned,
    p.tx_hash_lock,
    p.tx_hash_release,
    COUNT(e.id) as employee_count,
    SUM(e.amount) as total_employee_amount,
    p.created_at
FROM payrolls p
LEFT JOIN employees e ON p.id = e.payroll_id
GROUP BY p.id;

-- Comments for documentation
COMMENT ON TABLE payrolls IS 'Tracks payroll batches locked in the smart contract';
COMMENT ON TABLE employees IS 'Individual employee payment records from CSV uploads';
COMMENT ON TABLE sdp_uploads IS 'Tracks uploads to Stellar Disbursement Platform';
COMMENT ON COLUMN payrolls.batch_id IS 'Batch ID returned from smart contract lock_payroll()';
COMMENT ON COLUMN payrolls.vault_shares IS 'DeFindex vault shares received for this payroll';
COMMENT ON COLUMN payrolls.yield_earned IS 'Yield earned from DeFindex vault (calculated on release)';
