import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api'

interface WalletContextType {
  publicKey: string | null
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  signTransaction: (xdr: string, network: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Check if wallet is already connected
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const connected = await isConnected()
      if (connected) {
        const key = await getPublicKey()
        setPublicKey(key)
        setConnected(true)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const connectWallet = async () => {
    try {
      const key = await getPublicKey()
      setPublicKey(key)
      setConnected(true)
      console.log('Wallet connected:', key)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Please install Freighter wallet extension')
    }
  }

  const disconnectWallet = () => {
    setPublicKey(null)
    setConnected(false)
  }

  const signTx = async (xdr: string, network: string): Promise<string> => {
    try {
      const signedXdr = await signTransaction(xdr, network)
      return signedXdr
    } catch (error) {
      console.error('Error signing transaction:', error)
      throw error
    }
  }

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: connected,
        connectWallet,
        disconnectWallet,
        signTransaction: signTx
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
