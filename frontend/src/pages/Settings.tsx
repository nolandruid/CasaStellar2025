import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState({
    paymentConfirmations: true,
    processingErrors: true,
    complianceUpdates: false
  })

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
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
        <h2 className="header-title">Settings</h2>
        <div className="header-spacer"></div>
      </div>

      {/* Content */}
      <div className="settings-content">
        
        {/* Payroll Section */}
        <div className="settings-section">
          <h3 className="section-heading">Payroll</h3>
          <div className="section-items">
            <button className="settings-item">
              <div className="item-left">
                <svg viewBox="0 0 24 24" fill="currentColor" className="item-icon">
                  <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                </svg>
                <p className="item-text">Payment Schedule</p>
              </div>
              <svg viewBox="0 0 24 24" fill="currentColor" className="item-chevron">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>

            <div className="item-divider"></div>

            <button className="settings-item">
              <div className="item-left">
                <svg viewBox="0 0 24 24" fill="currentColor" className="item-icon">
                  <path d="M16.54 11L13 7.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66zM11 7H2v2h9V7zm10 6.41L19.59 12 17 14.59 14.41 12 13 13.41 15.59 16 13 18.59 14.41 20 17 17.41 19.59 20 21 18.59 18.41 16 21 13.41zM11 15H2v2h9v-2z"/>
                </svg>
                <p className="item-text">Validation Rules</p>
              </div>
              <svg viewBox="0 0 24 24" fill="currentColor" className="item-chevron">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Compliance Section */}
        <div className="settings-section">
          <h3 className="section-heading">Compliance</h3>
          <div className="section-items">
            <button className="settings-item">
              <div className="item-left">
                <svg viewBox="0 0 24 24" fill="currentColor" className="item-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p className="item-text">Tax Information</p>
              </div>
              <svg viewBox="0 0 24 24" fill="currentColor" className="item-chevron">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>

            <div className="item-divider"></div>

            <button className="settings-item">
              <div className="item-left">
                <svg viewBox="0 0 24 24" fill="currentColor" className="item-icon">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                <p className="item-text">Reporting</p>
              </div>
              <svg viewBox="0 0 24 24" fill="currentColor" className="item-chevron">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h3 className="section-heading">Notifications</h3>
          <div className="section-items">
            
            {/* Payment Confirmations */}
            <div className="settings-item toggle-item">
              <div className="item-content">
                <p className="item-text">Payment Confirmations</p>
                <p className="item-subtitle">Notify when payroll is sent</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notifications.paymentConfirmations}
                  onChange={() => handleToggle('paymentConfirmations')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="item-divider"></div>

            {/* Processing Errors */}
            <div className="settings-item toggle-item">
              <div className="item-content">
                <p className="item-text">Processing Errors</p>
                <p className="item-subtitle">Alert on failed payments</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notifications.processingErrors}
                  onChange={() => handleToggle('processingErrors')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="item-divider"></div>

            {/* Compliance Updates */}
            <div className="settings-item toggle-item">
              <div className="item-content">
                <p className="item-text">Compliance Updates</p>
                <p className="item-subtitle">Regulatory change alerts</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notifications.complianceUpdates}
                  onChange={() => handleToggle('complianceUpdates')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
