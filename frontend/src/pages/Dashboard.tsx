import { useState, useEffect } from 'react'
import WalletConnect from '../components/WalletConnect'
import { useAuth } from '../context/AuthContext'
import { employeesAPI, type Employee } from '../services/api'
import { 
  nextPayrollCycle, 
  payrollPool, 
  yieldStats, 
  yieldHistory,
  recentActivity,
  getDaysUntilNextPayroll
} from '../data/mockData'
import './Dashboard.css'

export default function Dashboard() {
  const { employer } = useAuth()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)

  // Load employees on mount
  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      const response = await employeesAPI.getAll()
      setEmployees(response.data)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  // Calculate real payroll data from employees
  const totalMonthlyPayroll = employees.reduce((sum, emp) => sum + Number(emp.salary), 0) // Total in XLM
  const employeeCount = employees.length

  // Pool data - using real total with mock current deposited for now
  const totalRequired = totalMonthlyPayroll
  const currentDeposited = Math.min(payrollPool.currentDeposited, totalRequired) // Don't exceed required
  const remainingAmount = Math.max(totalRequired - currentDeposited, 0)
  const progressPercentage = totalRequired > 0 ? (currentDeposited / totalRequired) * 100 : 0
  const daysUntilPayroll = getDaysUntilNextPayroll()

  const handleDeposit = async (type: 'full' | 'partial') => {
    setIsProcessing(true)
    
    try {
      // Aquí irá la lógica del smart contract
      const amount = type === 'full' ? remainingAmount : parseFloat(depositAmount)
      
      console.log(`Depositing ${amount} XLM to Defindex smart contract...`)
      
      // Simulación de llamada al contrato
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(`Deposit of ${amount.toFixed(2)} XLM completed successfully!`)
      setShowDepositModal(false)
      setDepositAmount('')
    } catch (error) {
      console.error('Deposit error:', error)
      alert('Deposit failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* TopAppBar */}
      <div className="dashboard-header">
        <div className="header-avatar">
          <div className="avatar-img"></div>
        </div>
        <h2 className="header-title">
          Welcome back, {employer ? `${employer.firstName}!` : 'Admin!'}
        </h2>
        <div className="header-actions">
          <WalletConnect />
        </div>
      </div>

      {/* Card: Upcoming Payroll */}
      <div className="dashboard-content">
        <div className="payroll-card">
          <div className="card-inner">
            <div className="card-header-row">
              <p className="card-title">Next Payroll</p>
              <div className="due-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" className="badge-icon">
                  <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"/>
                </svg>
                <span>Due in {daysUntilPayroll} days</span>
              </div>
            </div>
            <div className="amount-section">
              <p className="amount-label">Total amount to be disbursed</p>
              <p className="amount-value">
                {isLoadingEmployees ? (
                  <span style={{ fontSize: '1.5rem', color: '#6c757d' }}>Loading...</span>
                ) : (
                  `${totalMonthlyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`
                )}
              </p>
              <p className="amount-label" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                {isLoadingEmployees ? 'Loading employees...' : `${employeeCount} employees • ${nextPayrollCycle.period}`}
              </p>
            </div>
            <button className="btn-run-payroll">
              <span>Run Payroll</span>
            </button>
          </div>
        </div>

        {/* Payroll Funds Pool */}
        <div className="funds-pool-card">
          <div className="pool-header">
            <div className="pool-title-section">
              <h3 className="pool-title">Payroll Funds Pool</h3>
              <p className="pool-subtitle">Accumulate funds for next payroll cycle</p>
            </div>
            <button 
              className="btn-deposit"
              onClick={() => setShowDepositModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              <span>Deposit</span>
            </button>
          </div>

          <div className="pool-progress-section">
            {isLoadingEmployees ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem', borderWidth: '3px' }}></div>
                <p>Loading payroll data...</p>
              </div>
            ) : (
              <>
                <div className="pool-amounts">
                  <div className="pool-current">
                    <span className="pool-amount-label">Current</span>
                    <span className="pool-amount-value">
                      {currentDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
                    </span>
                  </div>
                  <div className="pool-divider">/</div>
                  <div className="pool-target">
                    <span className="pool-amount-label">Target</span>
                    <span className="pool-amount-value">
                      {totalRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
                    </span>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="pool-stats">
                  <div className="pool-stat-item">
                    <span className="pool-stat-label">Remaining</span>
                    <span className="pool-stat-value remaining">
                      {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
                    </span>
                  </div>
                  <div className="pool-stat-item">
                    <span className="pool-stat-label">Progress</span>
                    <span className="pool-stat-value">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="pool-stat-item">
                    <span className="pool-stat-label">Employees</span>
                    <span className="pool-stat-value">{employeeCount}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Yield Statistics */}
        <h3 className="section-title">Yield Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Yield This Cycle</p>
            <p className="stat-value">${yieldStats.currentCycle.toLocaleString()}</p>
            <p className="stat-change positive">+{yieldStats.cycleChange}%</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active Employees</p>
            <p className="stat-value">
              {isLoadingEmployees ? '...' : employeeCount}
            </p>
            <p className="stat-change positive">
              {isLoadingEmployees ? '...' : `+${employeeCount > 0 ? ((employeeCount / Math.max(employeeCount - 1, 1)) * 100 - 100).toFixed(1) : '0.0'}%`}
            </p>
          </div>
          <div className="stat-card stat-card-full">
            <p className="stat-label">YTD Yield Generated</p>
            <p className="stat-value">${yieldStats.yearToDate.toLocaleString()}</p>
            <p className="stat-change positive">+{yieldStats.ytdChange}%</p>
          </div>
        </div>

        {/* Yield History Chart */}
        <h3 className="section-title">Yield Generation History</h3>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <p className="chart-title">Last 6 Months</p>
              <p className="chart-subtitle">Yield earned from Defindex</p>
            </div>
            <a href="#" className="view-report">View Report</a>
          </div>
          <div className="chart-bars">
            {yieldHistory.map((data, index) => {
              const maxYield = Math.max(...yieldHistory.map(y => y.amount))
              const heightPercentage = (data.amount / maxYield) * 100
              const isLast = index === yieldHistory.length - 1
              return (
                <div className="bar-column" key={data.month}>
                  <div 
                    className={`bar ${isLast ? 'active' : ''}`} 
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                  <p className={`bar-label ${isLast ? 'active' : ''}`}>{data.month}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="section-header">
          <h3 className="section-title">Recent Activity</h3>
          <a href="/payment-proof" className="view-proof-link">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            View Payment Proof
          </a>
        </div>
        <div className="activity-list">
          {recentActivity.map((activity) => {
            const getIcon = () => {
              switch (activity.type) {
                case 'payroll':
                  return <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                case 'deposit':
                  return <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                case 'employee':
                  return <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                default:
                  return <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              }
            }

            return (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {getIcon()}
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">{activity.title}</p>
                  <p className="activity-date">{activity.date}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Deposit to Payroll Pool</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDepositModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <div className="info-row">
                  <span className="info-label">Current Pool:</span>
                  <span className="info-value">${currentDeposited.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Remaining Needed:</span>
                  <span className="info-value highlight">${remainingAmount.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Target Amount:</span>
                  <span className="info-value">${totalRequired.toLocaleString()}</span>
                </div>
              </div>

              <div className="deposit-options">
                <button 
                  className="btn-deposit-option full"
                  onClick={() => handleDeposit('full')}
                  disabled={isProcessing}
                >
                  <div className="option-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                  </div>
                  <div className="option-content">
                    <span className="option-title">Full Deposit</span>
                    <span className="option-amount">${remainingAmount.toLocaleString()}</span>
                    <span className="option-description">Complete the remaining amount</span>
                  </div>
                </button>

                <div className="divider-text">
                  <span>OR</span>
                </div>

                <div className="partial-deposit-section">
                  <label className="input-label">
                    <span>Partial Deposit</span>
                    <span className="label-hint">Enter amount in USD</span>
                  </label>
                  <div className="input-group">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      className="input-amount"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="0"
                      max={remainingAmount}
                      step="0.01"
                    />
                  </div>
                  <button 
                    className="btn-deposit-option partial"
                    onClick={() => handleDeposit('partial')}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isProcessing}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>{isProcessing ? 'Processing...' : 'Deposit Amount'}</span>
                  </button>
                </div>
              </div>

              <div className="modal-note">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p>Funds will be deposited to the Defindex smart contract for yield generation until payroll date.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
