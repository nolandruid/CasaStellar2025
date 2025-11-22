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
  txHashLock?: string
  txHashRelease?: string
}

export default function PayrollStatus() {
  const { publicKey } = useWallet()
  const [batch, setBatch] = useState<PayrollBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [releaseSuccess, setReleaseSuccess] = useState(false)

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
          txHashLock: status.tx_hash_lock,
          txHashRelease: status.tx_hash_release,
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

  const handleReleasePayroll = async () => {
    console.log('🔘 Release button clicked!')
    console.log('Batch:', batch)
    console.log('Public Key:', publicKey)
    
    if (!batch || !publicKey) {
      console.error('❌ Missing batch or publicKey')
      alert('Please connect your wallet first')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to release this payroll now?\n\n' +
      'This will:\n' +
      '• Release funds from the contract\n' +
      '• Distribute yield to employees\n' +
      '• Trigger SDP disbursement\n\n' +
      'Note: In production, this happens automatically on payout date.'
    )

    if (!confirmed) {
      console.log('User cancelled release')
      return
    }

    setReleasing(true)
    try {
      console.log(`🚀 Releasing payroll batch ${batch.batchId}`)
      
      const response = await payrollAPI.releasePayroll(batch.employer, batch.batchId)
      
      if (response.success) {
        console.log('✅ Payroll released successfully:', response)
        setReleaseSuccess(true)
        
        // Refresh status immediately
        await fetchPayrollStatus(batch.employer, batch.batchId)
        
        setTimeout(() => setReleaseSuccess(false), 5000)
      } else {
        throw new Error('Release failed')
      }
    } catch (error) {
      console.error('Error releasing payroll:', error)
      alert(`Failed to release payroll: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setReleasing(false)
    }
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

          {/* Transaction Hashes */}
          {(batch.txHashLock || batch.txHashRelease) && (
            <div className="transaction-section">
              <h3>🔗 Transactions</h3>
              {batch.txHashLock && batch.txHashLock !== 'contract_failed' && (
                <div className="tx-link">
                  <span className="tx-label">Lock TX:</span>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${batch.txHashLock}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-hash"
                  >
                    {batch.txHashLock.substring(0, 8)}...{batch.txHashLock.substring(batch.txHashLock.length - 8)} ↗
                  </a>
                </div>
              )}
              {batch.txHashRelease && (
                <div className="tx-link">
                  <span className="tx-label">Release TX:</span>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${batch.txHashRelease}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-hash"
                  >
                    {batch.txHashRelease.substring(0, 8)}...{batch.txHashRelease.substring(batch.txHashRelease.length - 8)} ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Release Button */}
          {!batch.fundsReleased && (
            <div className="action-section">
              <button 
                className="btn-release"
                onClick={handleReleasePayroll}
                disabled={releasing || !publicKey}
              >
                {releasing ? '⏳ Releasing...' : releaseSuccess ? '✓ Released!' : '🚀 Release Payroll Now'}
              </button>
              <p className="action-note">
                ⚠️ Manual release for demo purposes. In production, this triggers automatically on payout date.
              </p>
            </div>
          )}

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
