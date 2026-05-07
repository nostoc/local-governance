import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getGovWallet } from '../config/govAuthority';
import { createIssuedTicket, getCitizenByGovId } from '../models/citizen';

interface AuthResult {
  success: boolean;
  error?: string;
  ticketId?: string;
  signature?: string;
}

const getTicketExpiry = (): string | null => {
  const ttlSecondsRaw = process.env.TICKET_TTL_SECONDS;
  if (!ttlSecondsRaw) {
    return null;
  }

  const ttlSeconds = Number(ttlSecondsRaw);
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    return null;
  }

  return new Date(Date.now() + ttlSeconds * 1000).toISOString();
};

// Authenticate citizen and issue signed Ticket_ID
const authenticateAndGenerateProof = async (
  govId: string,
  password: string
): Promise<AuthResult> => {
  const citizen = getCitizenByGovId(govId);

  // Verify real-world identity
  if (!citizen || citizen.password !== password || citizen.status !== 'Active') {
    return {
      success: false,
      error: 'Invalid citizen credentials'
    };
  }

  const rawUuid = uuidv4();
  const ticketId = ethers.id(rawUuid);
  const signature = await getGovWallet().signMessage(ethers.getBytes(ticketId));

  createIssuedTicket(ticketId, signature, citizen.id, getTicketExpiry());

  return {
    success: true,
    ticketId,
    signature
  };
};

export { authenticateAndGenerateProof };
