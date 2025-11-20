import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import './PayrollUpload.css'

interface PayrollData {
  employees: string
  amount: string
  paymentDate: string
}

export default function PayrollUpload() {
  const { isConnected } = useWallet()
  const [formData, setFormData] = useState<PayrollData>({
    employees: '',
    amount: '',
    paymentDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setLoading(true)
    
    // Mock API call
    try {
      // Simulate API POST request
      await mockApiCall('/api/payroll/upload', formData)
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setFormData({ employees: '', amount: '', paymentDate: '' })
      }, 3000)
    } catch (error) {
      console.error('Error uploading payroll:', error)
      alert('Error uploading payroll data')
    } finally {
      setLoading(false)
    }
  }

  // Mock API function
  const mockApiCall = (endpoint: string, data: any): Promise<any> => {
    return new Promise((resolve) => {
      console.log(`Mock POST to ${endpoint}:`, data)
      setTimeout(() => {
        resolve({ success: true, data })
      }, 1500)
    })
  }

  return (
    <div className="payroll-upload">
      <h2>📤 Upload Payroll Batch</h2>
      <p className="subtitle">Submit your payroll data for processing on Stellar</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="employees">Employee List (CSV format or addresses)</label>
          <textarea
            id="employees"
            placeholder="GXXXXXXX, 1000&#10;GYYYYYYY, 1500&#10;GZZZZZZZ, 2000"
            value={formData.employees}
            onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
            rows={6}
            required
          />
          <span className="helper-text">Format: Stellar Address, Amount (one per line)</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Total Amount (USDC)</label>
            <input
              type="number"
              id="amount"
              placeholder="10000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date</label>
            <input
              type="date"
              id="paymentDate"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-submit"
          disabled={loading || !isConnected}
        >
          {loading ? 'Processing...' : success ? '✓ Uploaded!' : 'Submit Payroll'}
        </button>

        {!isConnected && (
          <p className="warning">⚠️ Please connect your wallet to submit payroll</p>
        )}
      </form>
    </div>
  )
}
