import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { payrollAPI, EmployeePayrollData } from '../services/api'
import './PayrollUpload.css'

interface PayrollData {
  employees: string
  amount: string
  paymentDate: string
}

export default function PayrollUpload() {
  const { isConnected, publicKey } = useWallet()
  
  // Calculate default date (30 seconds from now for demo) with time
  const getDefaultDate = () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() + 30) // 30 seconds from now for demo
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    return date.toISOString().slice(0, 16)
  }
  
  // Default test employees (under 10k total)
  const getDefaultEmployees = () => {
    return `GCTCBTX5WY5YPXG4VPK5ZYLS4QFW4CGAPZDKXRRMVGXNG7UYQUPQAIKJ, 500, Alice
GCTCBTX5WY5YPXG4VPK5ZYLS4QFW4CGAPZDKXRRMVGXNG7UYQUPQAIKJ, 750, Bob
GCTCBTX5WY5YPXG4VPK5ZYLS4QFW4CGAPZDKXRRMVGXNG7UYQUPQAIKJ, 1000, Charlie`
  }
  
  const [formData, setFormData] = useState<PayrollData>({
    employees: getDefaultEmployees(),
    amount: '2250', // Auto-calculated from default employees
    paymentDate: getDefaultDate()
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    batchId?: string
    txHash?: string
  } | null>(null)

  // Debug logging
  console.log('🔍 Wallet Debug:', { 
    isConnected, 
    publicKey, 
    hasPublicKey: !!publicKey,
    buttonDisabled: loading || !publicKey 
  })

  const parseEmployees = (employeesText: string): EmployeePayrollData[] => {
    const lines = employeesText.trim().split('\n')
    const employees: EmployeePayrollData[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const parts = line.trim().split(',').map(p => p.trim())
      if (parts.length >= 2) {
        const walletAddress = parts[0]
        const amount = parts[1]
        const name = parts[2] || `Employee ${i + 1}`
        
        employees.push({
          id: `emp-${Date.now()}-${i}`,
          name,
          walletAddress,
          amount,
        })
      }
    }
    
    return employees
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      
      // Parse CSV and calculate total
      const employees = parseEmployees(text)
      const total = employees.reduce((sum, emp) => {
        const amount = parseFloat(emp.amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      
      // Update form data
      setFormData({
        ...formData,
        employees: text,
        amount: total.toFixed(2),
      })
      
      console.log(`✅ Loaded ${employees.length} employees from CSV. Total: ${total}`)
    }
    
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !publicKey) {
      alert('Please connect your wallet first')
      return
    }

    setLoading(true)
    
    try {
      // Parse employee data
      const employees = parseEmployees(formData.employees)
      
      if (employees.length === 0) {
        alert('Please add at least one employee')
        setLoading(false)
        return
      }

      // Convert payment date to Unix timestamp
      const payoutDate = Math.floor(new Date(formData.paymentDate).getTime() / 1000)
      
      const payload = {
        employerAddress: publicKey,
        employees,
        payoutDate,
      }
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2))
      
      // Call real API
      const response = await payrollAPI.uploadPayroll(payload)
      
      console.log('✅ Payroll uploaded:', response)
      
      setUploadResult({
        batchId: response.batchId,
        txHash: response.txHash,
      })
      setSuccess(true)
      
      // Store batch ID in localStorage for status page
      if (response.batchId) {
        localStorage.setItem('lastBatchId', response.batchId)
        localStorage.setItem('lastEmployerAddress', publicKey)
      }
      
      setTimeout(() => {
        setSuccess(false)
        setFormData({ employees: '', amount: '', paymentDate: '' })
        setUploadResult(null)
      }, 5000)
    } catch (error) {
      console.error('Error uploading payroll:', error)
      alert(`Error uploading payroll: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payroll-upload">
      <h2>📤 Upload Payroll Batch</h2>
      <p className="subtitle">Submit your payroll data for processing on Stellar</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="employees">Employee List</label>
          
          {/* CSV File Upload Button */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              id="csvFile"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="csvFile" className="btn-upload-csv">
              📁 Upload CSV File
            </label>
            <span style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
              or paste data below
            </span>
          </div>

          <textarea
            id="employees"
            placeholder="GXXXXXXX, 1000, Alice&#10;GYYYYYYY, 1500, Bob&#10;GZZZZZZZ, 2000, Charlie"
            value={formData.employees}
            onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
            rows={6}
            required
          />
          <span className="helper-text">Format: Stellar Address, Amount, Name (one per line)</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Total Amount (XLM)</label>
            <input
              type="number"
              id="amount"
              placeholder="10000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="0.01"
              required
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date & Time</label>
            <input
              type="datetime-local"
              id="paymentDate"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
            <span className="helper-text">For demo: Set to current time + 30 seconds</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-submit"
          disabled={loading || !publicKey}
        >
          {loading ? 'Processing...' : success ? '✓ Uploaded!' : 'Submit Payroll'}
        </button>

        {!publicKey && (
          <p className="warning">⚠️ Please connect your wallet to submit payroll</p>
        )}

        {uploadResult && (
          <div className="upload-result">
            <p className="success">✅ Payroll uploaded successfully!</p>
            {uploadResult.batchId && (
              <p><strong>Batch ID:</strong> {uploadResult.batchId}</p>
            )}
            {uploadResult.txHash && (
              <p>
                <strong>Transaction:</strong>{' '}
                <a 
                  href={`https://stellar.expert/explorer/testnet/tx/${uploadResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Stellar Expert ↗
                </a>
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
