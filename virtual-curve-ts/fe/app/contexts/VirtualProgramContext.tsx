import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { Connection } from '@solana/web3.js'
import { VirtualCurveSDK } from '../../../lib/src'

// Define the shape of our context
interface VirtualProgramContextState {
  sdk: VirtualCurveSDK | null
  connection: Connection | null
}

// Create the context with a default value
const VirtualProgramContext = createContext<VirtualProgramContextState>({
  sdk: null,
  connection: null,
})

// Provider props interface
interface VirtualProgramProviderProps {
  children: ReactNode
  rpcEndpoint: string // Allow the RPC endpoint to be passed in
}

export const VirtualProgramProvider: React.FC<VirtualProgramProviderProps> = ({
  children,
  rpcEndpoint,
}) => {
  const connection = useMemo<Connection>(
    () => new Connection(rpcEndpoint, 'confirmed'),
    [rpcEndpoint]
  )
  const sdk = useMemo(() => {
    if (!connection) return null
    return new VirtualCurveSDK(connection)
  }, [connection])
  const contextValue: VirtualProgramContextState = {
    sdk,
    connection,
  }

  return (
    <VirtualProgramContext.Provider value={contextValue}>
      {children}
    </VirtualProgramContext.Provider>
  )
}

// Custom hook to use the Virtual Program context
export const useVirtualProgram = () => {
  const context = useContext(VirtualProgramContext)
  if (context === undefined) {
    throw new Error(
      'useVirtualProgram must be used within a VirtualProgramProvider'
    )
  }
  return context
}
