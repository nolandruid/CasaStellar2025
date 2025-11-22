import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './LoginScreen.css'

interface LoginScreenProps {
  onLoginSuccess?: () => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login({ email, password })
      login(response.data.token, response.data.employer)
      
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* Logo and Title */}
        <div className="login-header">
          <div className="header-logo">
            <img 
              src="/assets/paydat_logo.jpeg" 
              alt="PayDay Logo" 
              className="logo-image-login"
            />
          </div>
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Please sign in to continue.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgb(239, 68, 68)',
            color: '#fecaca',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email or Username
            </label>
            
            <div className="input-wrapper">
            <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
           
            <div className="input-wrapper">
                 <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-footer">
            <a href="#" className="forgot-link">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                </svg>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: '#d1d5db' }}>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{
                color: '#a78bfa',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#c4b5fd'}
              onMouseOut={(e) => e.currentTarget.style.color = '#a78bfa'}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
