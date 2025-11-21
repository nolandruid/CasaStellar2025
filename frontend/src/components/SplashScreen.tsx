import { useEffect } from 'react'
import './SplashScreen.css'

interface SplashScreenProps {
  onLoadingComplete: () => void
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  useEffect(() => {
    // Simulate loading for 3 seconds
    const timer = setTimeout(() => {
      onLoadingComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onLoadingComplete])

  return (
    <div className="splash-screen">
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo">
          <img 
            src="/assets/paydat_logo.jpeg" 
            alt="PayDay Logo" 
            className="logo-image"
          />
        </div>

        {/* Loading Bar */}
        <div className="loading-container">
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          <p className="loading-text">Starting engine...</p>
        </div>
      </div>
    </div>
  )
}
