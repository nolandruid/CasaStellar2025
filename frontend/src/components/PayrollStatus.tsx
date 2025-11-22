import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { payrollAPI } from '../services/api'
import './PayrollStatus.css'

interface PayrollBatch {
  batchId: string
  employer: string
  totalAmount: string
  vaultShares: string
  lockDate: number
  payoutDate: number
  yieldEarned: string
  fundsReleased: boolean
  yieldClaimed: boolean
  currentYield?: string
  elapsedTime?: number
}

export default function PayrollStatus() {
  const { publicKey } = useWallet()
  const [batch, setBatch] = useState<PayrollBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get last batch ID from localStorage
    const lastBatchId = localStorage.getItem('lastBatchId')
    const lastEmployerAddress = localStorage.getItem('lastEmployerAddress')
    
    if (lastBatchId && lastEmployerAddress) {
      fetchPayrollStatus(lastEmployerAddress, lastBatchId)
      
      // Poll every 10 seconds for real-time yield updates
      const interval = setInterval(() => {
        fetchPayrollStatus(lastEmployerAddress, lastBatchId)
      }, 10000)
      
      return () => clearInterval(interval)
    } else {
      setLoading(false)
      setError('No payroll batch found. Please upload a payroll first.')
    }
  }, [])

  const fetchPayrollStatus = async (employerAddress: string, batchId: string) => {
    try {
      setError(null)
      
      // Fetch both status and current yield
      const [statusResponse, yieldResponse] = await Promise.all([
        payrollAPI.getStatus(employerAddress, batchId),
        payrollAPI.calculateCurrentYield(employerAddress, batchId),
      ])
      
      if (statusResponse.success && yieldResponse.success) {
        const status = statusResponse.data
        const yieldData = yieldResponse.data
        
        setBatch({
          batchId,
          employer: status.employer,
          totalAmount: status.total_amount,
          vaultShares: status.vault_shares,
          lockDate: status.lock_date,
          payoutDate: status.payout_date,
          yieldEarned: status.yield_earned,
          fundsReleased: status.funds_released,
          yieldClaimed: status.yield_claimed,
          currentYield: yieldData.currentYield,
          elapsedTime: yieldData.elapsedTime,
        })
      }
    } catch (error) {
      console.error('Error fetching payroll status:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch payroll status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (fundsReleased: boolean, yieldClaimed: boolean) => {
    if (fundsReleased && yieldClaimed) return '✓'
    if (fundsReleased) return '⟳'
    return '⏱'
  }

  const getStatusText = (fundsReleased: boolean, yieldClaimed: boolean) => {
    if (fundsReleased && yieldClaimed) return 'COMPLETED'
    if (fundsReleased) return 'RELEASED'
    return 'LOCKED'
  }

  const formatElapsedTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const stroopsToAmount = (stroops: string) => {
    const amount = BigInt(stroops) / BigInt(10000000)
    return amount.toString()
  }

  return (
    <div className="payroll-status">
      <div className="header">
        <h2>📊 Payroll Status</h2>
        <p className="subtitle">Real-time yield tracking • Updates every 10 seconds</p>
      </div>

      {loading ? (
        <div className="loading">Loading payroll data...</div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
          <p className="small">Upload a payroll batch to start tracking</p>
        </div>
      ) : batch ? (
        <div className="batch-card">
          <div className="batch-header">
            <span className="batch-id">Batch #{batch.batchId}</span>
            <span className={`status-badge ${batch.fundsReleased ? 'status-completed' : 'status-processing'}`}>
              {getStatusIcon(batch.fundsReleased, batch.yieldClaimed)} {getStatusText(batch.fundsReleased, batch.yieldClaimed)}
            </span>
          </div>

          <div className="batch-details">
            <div className="detail-row">
              <span className="label">Total Amount:</span>
              <span className="value">{stroopsToAmount(batch.totalAmount)} XLM</span>
            </div>
            <div className="detail-row">
              <span className="label">Lock Date:</span>
              <span className="value">{formatDate(batch.lockDate)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Payout Date:</span>
              <span className="value">{formatDate(batch.payoutDate)}</span>
            </div>
            <div className="detail-row highlight">
              <span className="label">⏱ Locked For:</span>
              <span className="value">{batch.elapsedTime ? formatElapsedTime(batch.elapsedTime) : 'Calculating...'}</span>
            </div>
            <div className="detail-row highlight">
              <span className="label">💰 Current Yield:</span>
              <span className="value success">
                {batch.currentYield ? stroopsToAmount(batch.currentYield) : '0'} XLM
              </span>
            </div>
            {batch.fundsReleased && (
              <div className="detail-row">
                <span className="label">✅ Status:</span>
                <span className="value">Funds Released to Employees</span>
              </div>
            )}
          </div>

          <div className="batch-footer">
            <span className="created-at">
              Employer: {batch.employer.substring(0, 8)}...{batch.employer.substring(batch.employer.length - 8)}
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No payroll batch found</p>
          <p className="small">Submit your first payroll to get started</p>
        </div>
      )}
    </div>
  )
}
