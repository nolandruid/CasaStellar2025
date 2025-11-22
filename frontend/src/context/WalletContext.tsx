import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils'

interface WalletContextType {
  publicKey: string | null
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initialize Stellar Wallets Kit once on mount
    if (!initialized) {
      try {
        StellarWalletsKit.init({ modules: defaultModules() })
        setInitialized(true)
        console.log('Stellar Wallets Kit initialized')
      } catch (error) {
        console.error('Error initializing Stellar Wallets Kit:', error)
      }
    }
  }, [initialized])

  const connectWallet = async () => {
    if (!initialized) {
      alert('Wallet kit is still initializing. Please wait a moment and try again.')
      return
    }

    try {
      console.log('🔌 Attempting to connect wallet...')
      
      // Get the address from the selected wallet
      const result = await StellarWalletsKit.getAddress()
      console.log('📥 Wallet result:', result)
      
      if (result && result.address) {
        setPublicKey(result.address)
        setConnected(true)
        console.log('✅ Wallet connected successfully!')
        console.log('📍 Public Key:', result.address)
      } else {
        console.error('❌ No address returned from wallet')
        alert('Failed to get wallet address. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error)
      alert('Error connecting to wallet. Please make sure you have Freighter installed and try again.')
    }
  }

  const disconnectWallet = () => {
    setPublicKey(null)
    setConnected(false)
    console.log('Wallet disconnected')
  }

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: connected,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
