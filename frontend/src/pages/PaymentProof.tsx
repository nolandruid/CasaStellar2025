import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lastPaymentProof } from '../data/mockData'
import './PaymentProof.css'

export default function PaymentProof() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const { payrollCycle, proofHash, proofHashShort, verified, onTime } = lastPaymentProof
  const fullProofHash = proofHash

  const handleCopyProof = () => {
    navigator.clipboard.writeText(fullProofHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareProof = () => {
    if (navigator.share) {
      navigator.share({
        title: 'PayDay - Payment Proof',
        text: 'Payments for June 2024 were verified and sent on time.',
        url: window.location.href
      })
    } else {
      alert('Share functionality not supported on this browser')
    }
  }

  const handleDownloadReport = () => {
    // Simulate report download
    const reportData = `
PayDay Payment Proof Report
============================

Proof Verified: ${verified ? '✓' : '✗'}
Payment Period: ${payrollCycle.period}

Proof Details:
-------------
Payroll Cycle: ${payrollCycle.startDate} - ${payrollCycle.endDate}
Payment Due Date: ${payrollCycle.dueDate}
Actual Payment Date: ${payrollCycle.actualPaymentDate}
Status: ${onTime ? 'On Time' : 'Delayed'}

Zero-Knowledge Proof:
--------------------
${fullProofHash}

This cryptographic proof confirms ${onTime ? 'on-time' : ''} payment without revealing 
employee salaries or wallet addresses.

Generated: ${new Date().toLocaleString()}
`
    
    const blob = new Blob([reportData], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payday-payment-proof-june-2024.txt'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="proof-container">
      {/* Header */}
      <div className="proof-header">
        <div className="header-back">
          <button 
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        </div>
        <h2 className="header-title">Payment Proof</h2>
        <div className="header-spacer"></div>
      </div>

      {/* Content */}
      <div className="proof-content">
        
        {/* Verification Success Card */}
        <div className="verification-card">
          <div className="verification-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
          <h1 className="verification-title">Proof {verified ? 'Verified' : 'Failed'}</h1>
          <p className="verification-subtitle">
            Payments for {payrollCycle.period} were sent {onTime ? 'on time' : 'with delay'}.
          </p>
        </div>

        {/* Proof Details Card */}
        <div className="details-card">
          <h3 className="card-heading">Proof Details</h3>
          <div className="details-list">
            
            <div className="detail-item">
              <p className="detail-label">Payroll Cycle</p>
              <p className="detail-value">{payrollCycle.startDate} - {payrollCycle.endDate}</p>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-item">
              <p className="detail-label">Payment Due Date</p>
              <p className="detail-value">{payrollCycle.dueDate}</p>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-item">
              <p className="detail-label">Actual Payment Date</p>
              <p className="detail-value">{payrollCycle.actualPaymentDate}</p>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-item">
              <p className="detail-label">Status</p>
              <div className="status-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{onTime ? 'On Time' : 'Delayed'}</span>
              </div>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-item">
              <p className="detail-label">Total Amount</p>
              <p className="detail-value">${payrollCycle.totalAmount.toLocaleString()}</p>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-item">
              <p className="detail-label">Employees Paid</p>
              <p className="detail-value">{payrollCycle.employeeCount}</p>
            </div>

          </div>
        </div>

        {/* Zero-Knowledge Proof Card */}
        <div className="zk-proof-card">
          <div className="zk-header">
            <h3 className="card-heading">Zero-Knowledge Proof</h3>
            <button 
              className="help-button"
              title="What is Zero-Knowledge Proof?"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </button>
          </div>
          <p className="zk-description">
            This cryptographic proof confirms {onTime ? 'on-time' : ''} payment without revealing 
            employee salaries or wallet addresses.
          </p>
          <div className="proof-hash-container">
            <p className="proof-hash">{proofHashShort}</p>
            <button 
              className="btn-copy"
              onClick={handleCopyProof}
              title={copied ? 'Copied!' : 'Copy proof hash'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                {copied ? (
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                ) : (
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={handleShareProof}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            <span>Share Proof</span>
          </button>

          <button 
            className="btn-secondary"
            onClick={handleDownloadReport}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
            </svg>
            <span>Download Report</span>
          </button>
        </div>

      </div>
    </div>
  )
}
