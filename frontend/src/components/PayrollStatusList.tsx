import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { payrollAPI } from '../services/api'
import './PayrollStatus.css'

interface PayrollBatch {
  batchId: string
  employer: string
  totalAmount: string
  lockDate: number
  payoutDate: number
  status: string
  txHashLock?: string
  txHashRelease?: string
  fundsReleased: boolean
  yieldClaimed: boolean
}

export default function PayrollStatusList() {
  const { publicKey } = useWallet()
  const [batches, setBatches] = useState<PayrollBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [releasingBatch, setReleasingBatch] = useState<string | null>(null)

  useEffect(() => {
    if (publicKey) {
      fetchAllPayrolls()
      
      // Poll every 10 seconds
      const interval = setInterval(() => {
        fetchAllPayrolls()
      }, 10000)
      
      return () => clearInterval(interval)
    } else {
      setLoading(false)
      setError('Please connect your wallet to view payroll history.')
    }
  }, [publicKey])

  const fetchAllPayrolls = async () => {
    if (!publicKey) return
    
    try {
      setError(null)
      const response = await payrollAPI.getPayrolls(publicKey)
      
      if (response.success && response.data) {
        // Fetch status for each payroll
        const batchesWithStatus = await Promise.all(
          response.data.map(async (payroll: any) => {
            try {
              const statusResponse = await payrollAPI.getStatus(
                payroll.employer_address,
                payroll.batch_id.toString()
              )
              
              if (statusResponse.success) {
                const status = statusResponse.data
                return {
                  batchId: payroll.batch_id.toString(),
                  employer: payroll.employer_address,
                  totalAmount: status.total_amount,
                  lockDate: status.lock_date,
                  payoutDate: status.payout_date,
                  status: payroll.status,
                  txHashLock: payroll.tx_hash_lock,
                  txHashRelease: payroll.tx_hash_release,
                  fundsReleased: status.funds_released,
                  yieldClaimed: status.yield_claimed,
                }
              }
            } catch (err) {
              console.error(`Failed to fetch status for batch ${payroll.batch_id}:`, err)
            }
            return null
          })
        )
        
        setBatches(batchesWithStatus.filter(Boolean) as PayrollBatch[])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching payrolls:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch payrolls')
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const stroopsToAmount = (stroops: string) => {
    const amount = BigInt(stroops) / BigInt(10000000)
    return amount.toString()
  }

  const getStatusBadge = (batch: PayrollBatch) => {
    if (batch.fundsReleased) {
      return <span className="status-badge status-completed">✅ RELEASED</span>
    }
    const now = Math.floor(Date.now() / 1000)
    if (now >= batch.payoutDate) {
      return <span className="status-badge status-processing">⏳ DUE</span>
    }
    return <span className="status-badge status-processing">🔒 LOCKED</span>
  }

  const handleReleasePayroll = async (batch: PayrollBatch) => {
    if (!publicKey) {
      alert('Please connect your wallet first')
      return
    }

    const confirmed = window.confirm(
      `Release Batch #${batch.batchId} now?\n\n` +
      'This will:\n' +
      '• Release funds from the contract\n' +
      '• Distribute yield to employees\n' +
      '• Trigger SDP disbursement'
    )

    if (!confirmed) return

    setReleasingBatch(batch.batchId)
    try {
      const response = await payrollAPI.releasePayroll(batch.employer, batch.batchId)
      
      if (response.success) {
        alert('✅ Payroll released successfully!')
        await fetchAllPayrolls() // Refresh list
      } else {
        throw new Error('Release failed')
      }
    } catch (error) {
      console.error('Error releasing payroll:', error)
      alert(`Failed to release payroll: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setReleasingBatch(null)
    }
  }

  return (
    <div className="payroll-status">
      <div className="header">
        <h2>📊 Payroll History</h2>
        <p className="subtitle">All your payroll batches • Updates every 10 seconds</p>
      </div>

      {loading ? (
        <div className="loading">Loading payroll data...</div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
          <p className="small">Upload a payroll batch to start tracking</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <p>No payroll batches found</p>
          <p className="small">Upload your first payroll to get started</p>
        </div>
      ) : (
        <div className="batches-list">
          {batches.map((batch) => (
            <div key={batch.batchId} className="batch-card">
              <div className="batch-header">
                <span className="batch-id">Batch #{batch.batchId}</span>
                {getStatusBadge(batch)}
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
              </div>

              {/* Release Button */}
              {!batch.fundsReleased && (
                <div className="action-section">
                  <button
                    onClick={() => handleReleasePayroll(batch)}
                    disabled={releasingBatch === batch.batchId}
                    className="release-button"
                  >
                    {releasingBatch === batch.batchId ? '⏳ Releasing...' : '🚀 Release Payroll Now'}
                  </button>
                </div>
              )}

              {/* Transaction Links */}
              {(batch.txHashLock || batch.txHashRelease) && (
                <div className="transaction-section">
                  <h4>📝 Transactions</h4>
                  {batch.txHashLock && (
                    <div className="tx-link">
                      <span>Lock TX:</span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${batch.txHashLock}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {batch.txHashLock.substring(0, 8)}...{batch.txHashLock.substring(batch.txHashLock.length - 8)} ↗
                      </a>
                    </div>
                  )}
                  {batch.txHashRelease && (
                    <div className="tx-link">
                      <span>Release TX:</span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${batch.txHashRelease}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {batch.txHashRelease.substring(0, 8)}...{batch.txHashRelease.substring(batch.txHashRelease.length - 8)} ↗
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
