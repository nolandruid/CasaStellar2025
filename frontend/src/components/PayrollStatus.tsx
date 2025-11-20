import { useState, useEffect } from 'react'
import './PayrollStatus.css'

interface PayrollBatch {
  id: string
  totalAmount: string
  employeeCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentDate: string
  createdAt: string
  yieldGenerated?: string
}

export default function PayrollStatus() {
  const [batches, setBatches] = useState<PayrollBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayrollStatus()
  }, [])

  const fetchPayrollStatus = async () => {
    setLoading(true)
    
    // Mock API call
    try {
      const data = await mockApiGet('/api/payroll/status')
      setBatches(data)
    } catch (error) {
      console.error('Error fetching payroll status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock API function
  const mockApiGet = (endpoint: string): Promise<PayrollBatch[]> => {
    return new Promise((resolve) => {
      console.log(`Mock GET from ${endpoint}`)
      setTimeout(() => {
        // Mock data
        resolve([
          {
            id: 'batch-001',
            totalAmount: '50,000',
            employeeCount: 25,
            status: 'completed',
            paymentDate: '2025-11-25',
            createdAt: '2025-11-18',
            yieldGenerated: '125.50'
          },
          {
            id: 'batch-002',
            totalAmount: '75,000',
            employeeCount: 30,
            status: 'processing',
            paymentDate: '2025-11-30',
            createdAt: '2025-11-19',
            yieldGenerated: '85.30'
          },
          {
            id: 'batch-003',
            totalAmount: '100,000',
            employeeCount: 50,
            status: 'pending',
            paymentDate: '2025-12-05',
            createdAt: '2025-11-20',
            yieldGenerated: '0.00'
          }
        ])
      }, 1000)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'processing': return 'status-processing'
      case 'pending': return 'status-pending'
      case 'failed': return 'status-failed'
      default: return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓'
      case 'processing': return '⟳'
      case 'pending': return '⏱'
      case 'failed': return '✗'
      default: return '?'
    }
  }

  return (
    <div className="payroll-status">
      <div className="header">
        <h2>📊 Payroll Status</h2>
        <button onClick={fetchPayrollStatus} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>
      <p className="subtitle">Track your payroll batches and yield generation</p>

      {loading ? (
        <div className="loading">Loading payroll data...</div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <p>No payroll batches found</p>
          <p className="small">Submit your first payroll to get started</p>
        </div>
      ) : (
        <div className="batches-grid">
          {batches.map((batch) => (
            <div key={batch.id} className="batch-card">
              <div className="batch-header">
                <span className="batch-id">{batch.id}</span>
                <span className={`status-badge ${getStatusColor(batch.status)}`}>
                  {getStatusIcon(batch.status)} {batch.status.toUpperCase()}
                </span>
              </div>

              <div className="batch-details">
                <div className="detail-row">
                  <span className="label">Total Amount:</span>
                  <span className="value">${batch.totalAmount} USDC</span>
                </div>
                <div className="detail-row">
                  <span className="label">Employees:</span>
                  <span className="value">{batch.employeeCount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Date:</span>
                  <span className="value">{batch.paymentDate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Yield Generated:</span>
                  <span className="value success">${batch.yieldGenerated} USDC</span>
                </div>
              </div>

              <div className="batch-footer">
                <span className="created-at">Created: {batch.createdAt}</span>
                <button className="btn-details">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
