/**
 * Realtime Context - Stub for real-time features
 * This is a placeholder for the realtime context functionality
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface RealtimeContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const value: RealtimeContextType = {
    isConnected: false,
    connect: () => {},
    disconnect: () => {},
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
