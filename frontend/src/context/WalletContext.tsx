import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StellarWalletsKit, Networks } from '@creit-tech/stellar-wallets-kit'
import { FreighterModule, FREIGHTER_ID } from '@creit-tech/stellar-wallets-kit/modules/freighter'
import { xBullModule } from '@creit-tech/stellar-wallets-kit/modules/xbull'
import { LobstrModule } from '@creit-tech/stellar-wallets-kit/modules/lobstr'

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
    // Initialize the Stellar Wallets Kit once
    if (!initialized) {
      StellarWalletsKit.init({
        network: Networks.TESTNET, // Change to Networks.PUBLIC for production
        selectedWalletId: FREIGHTER_ID,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new LobstrModule(),
        ],
      })
      setInitialized(true)
      console.log('✅ Stellar Wallets Kit initialized')
    }
  }, [initialized])

  const connectWallet = async () => {
    try {
      console.log('🔌 Opening wallet authentication modal...')
      
      // Open the authentication modal - it handles wallet selection and connection
      const { address } = await StellarWalletsKit.authModal()
      
      if (address) {
        setPublicKey(address)
        setConnected(true)
        console.log('✅ Wallet connected successfully!')
        console.log('📍 Public Key:', address)
      } else {
        alert('Failed to get wallet address. Please try again.')
      }
    } catch (error: any) {
      console.error('❌ Error connecting wallet:', error)
      
      if (error?.message?.includes('User declined') || error?.message?.includes('rejected') || error?.message?.includes('closed')) {
        console.log('Connection cancelled by user')
      } else {
        alert(`Error: ${error?.message || 'Failed to connect wallet'}`)
      }
    }
  }

  const disconnectWallet = async () => {
    try {
      await StellarWalletsKit.disconnect()
      setPublicKey(null)
      setConnected(false)
      console.log('Wallet disconnected')
    } catch (error) {
      console.error('Error disconnecting:', error)
      // Still clear local state even if disconnect fails
      setPublicKey(null)
      setConnected(false)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: connected,
        connectWallet,
        disconnectWallet,
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
