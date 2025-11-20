import WalletConnect from '../components/WalletConnect'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* TopAppBar */}
      <div className="dashboard-header">
        <div className="header-avatar">
          <div className="avatar-img"></div>
        </div>
        <h2 className="header-title">Welcome back, Sarah!</h2>
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
                <span>Due in 5 days</span>
              </div>
            </div>
            <div className="amount-section">
              <p className="amount-label">Total amount to be disbursed</p>
              <p className="amount-value">$85,430.00</p>
            </div>
            <button className="btn-run-payroll">
              <span>Run Payroll</span>
            </button>
          </div>
        </div>

        {/* Yield Statistics */}
        <h3 className="section-title">Yield Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Yield This Cycle</p>
            <p className="stat-value">$1,250</p>
            <p className="stat-change positive">+2.5%</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active Employees</p>
            <p className="stat-value">152</p>
            <p className="stat-change positive">+1.2%</p>
          </div>
          <div className="stat-card stat-card-full">
            <p className="stat-label">YTD Payout</p>
            <p className="stat-value">$256,290</p>
            <p className="stat-change positive">+15.8%</p>
          </div>
        </div>

        {/* Payment History */}
        <h3 className="section-title">Payment History</h3>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <p className="chart-title">Last 6 Months</p>
              <p className="chart-subtitle">Total payroll disbursement</p>
            </div>
            <a href="#" className="view-report">View Report</a>
          </div>
          <div className="chart-bars">
            <div className="bar-column">
              <div className="bar" style={{ height: '90%' }}></div>
              <p className="bar-label">Jan</p>
            </div>
            <div className="bar-column">
              <div className="bar" style={{ height: '40%' }}></div>
              <p className="bar-label">Feb</p>
            </div>
            <div className="bar-column">
              <div className="bar" style={{ height: '20%' }}></div>
              <p className="bar-label">Mar</p>
            </div>
            <div className="bar-column">
              <div className="bar" style={{ height: '80%' }}></div>
              <p className="bar-label">Apr</p>
            </div>
            <div className="bar-column">
              <div className="bar" style={{ height: '60%' }}></div>
              <p className="bar-label">May</p>
            </div>
            <div className="bar-column">
              <div className="bar active" style={{ height: '95%' }}></div>
              <p className="bar-label active">Jun</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
            </div>
            <div className="activity-content">
              <p className="activity-title">Payroll for May 2024 processed.</p>
              <p className="activity-date">June 1, 2024</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="activity-content">
              <p className="activity-title">New employee, John Doe, was added.</p>
              <p className="activity-date">May 28, 2024</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </div>
            <div className="activity-content">
              <p className="activity-title">Jane Smith's tax info was updated.</p>
              <p className="activity-date">May 25, 2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
