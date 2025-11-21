import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Dashboard from './pages/Dashboard'
import Status from './pages/Status'
import Employees from './pages/Employees'
import Settings from './pages/Settings'
import PaymentProof from './pages/PaymentProof'
import SplashScreen from './components/SplashScreen'
import LoginScreen from './components/LoginScreen'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user was previously authenticated
    const auth = localStorage.getItem('isAuthenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    // Save authentication state
    localStorage.setItem('isAuthenticated', String(isAuthenticated))
  }, [isAuthenticated])

  const handleLoadingComplete = () => {
    setShowSplash(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
  }

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onLoadingComplete={handleLoadingComplete} />
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Show main app if authenticated
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="app">
          <nav className="main-nav">
            <div className="nav-content">
              <Link to="/" className="nav-logo">
                <img 
                  src="/assets/paydat_logo.jpeg" 
                  alt="PayDay" 
                  className="logo-nav-image"
                />
                <span className="logo-text">PayDay</span>
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link">Dashboard</Link>
                <Link to="/employees" className="nav-link">Employees</Link>
                <Link to="/status" className="nav-link">Status</Link>
                <Link to="/settings" className="nav-link">Settings</Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/status" element={<Status />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/payment-proof" element={<PaymentProof />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </WalletProvider>
    </BrowserRouter>
  )
}

export default App
