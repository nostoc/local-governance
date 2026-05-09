"use client";

// context/CitizenContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { CitizenWallet } from '@/lib/walletUtils';

// Define the ticket structure based on your ZKP server response
export interface ZkpTicket {
  ticketId: string;
  signature: string;
}

interface CitizenContextType {
  wallet: CitizenWallet | null;
  ticketBatch: ZkpTicket[];
  login: (wallet: CitizenWallet, tickets: ZkpTicket[]) => void;
  logout: () => void;
  consumeTicket: () => ZkpTicket | null;
  availableTicketsCount: number;
}

const CitizenContext = createContext<CitizenContextType | undefined>(undefined);

export const CitizenProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<CitizenWallet | null>(null);
  const [ticketBatch, setTicketBatch] = useState<ZkpTicket[]>([]);

  const login = (newWallet: CitizenWallet, tickets: ZkpTicket[]) => {
    setWallet(newWallet);
    setTicketBatch(tickets);
  };

  const logout = () => {
    setWallet(null);
    setTicketBatch([]);
  };

  // This is the crucial function: it gives you a ticket and removes it from the state
  const consumeTicket = (): ZkpTicket | null => {
    if (ticketBatch.length === 0) return null;
    
    const ticketToUse = ticketBatch[0];
    // Remove the used ticket from the array
    setTicketBatch((prev) => prev.slice(1)); 
    
    return ticketToUse;
  };

  return (
    <CitizenContext.Provider value={{ 
      wallet, 
      ticketBatch, 
      login, 
      logout, 
      consumeTicket,
      availableTicketsCount: ticketBatch.length 
    }}>
      {children}
    </CitizenContext.Provider>
  );
};

export const useCitizen = () => {
  const context = useContext(CitizenContext);
  if (!context) throw new Error("useCitizen must be used within a CitizenProvider");
  return context;
};