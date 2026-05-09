import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainService } from '../blockchain/blockchain.service';
// import { IpfsService } from '../ipfs/ipfs.service';
// import { AiOracleService } from '../ai-oracle/ai-oracle.service';
import multer from 'multer';

export interface SubmitReportPayload {
  description: string;
  zkpTicketId: string;
  zkpSignature: string;
  citizenPubKey: string;
  signature: string;
}

@Injectable()
export class ReportingService implements OnModuleInit {
  private readonly logger = new Logger(ReportingService.name);

  // We will store the fetched key here dynamically instead of hardcoding it
  private govPublicKey: string = '';

  constructor(
    private readonly blockchainService: BlockchainService,
    // private readonly ipfsService: IpfsService,
    // private readonly aiOracleService: AiOracleService,
  ) {}

  // This runs automatically when the NestJS application starts
  async onModuleInit() {
    await this.fetchGovPublicKey();
  }

  // Helper method to fetch the key from your ZKP simulator
  private async fetchGovPublicKey() {
    try {
      // Assuming your ZKP simulator runs on port 3001 locally. 
      // You can override this in your Relayer's .env if needed.
      const zkpUrl = process.env.ZKP_SIMULATOR_URL || 'http://localhost:3001';
      
      this.logger.log(`Fetching Government Public Key from ${zkpUrl}...`);
      const response = await fetch(`${zkpUrl}/api/public-key`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      this.govPublicKey = data.authorityAddress;
      
      this.logger.log(`✅ Successfully loaded Gov Public Key: ${this.govPublicKey}`);
    } catch (error: any) {
      this.logger.warn(`⚠️ Failed to fetch Gov Public Key from simulator: ${error.message}`);
      
      // Fallback: If the simulator is offline during startup, try to use the .env variable
      this.govPublicKey = process.env.GOV_PUBLIC_KEY || '0xYourGovWalletPublicKeyHere';
      this.logger.log(`🔄 Falling back to .env GOV_PUBLIC_KEY: ${this.govPublicKey}`);
    }
  }

  async createReport(payload: SubmitReportPayload, image?: Express.Multer.File) {
    const { description, zkpTicketId, zkpSignature, citizenPubKey, signature } = payload;

    if (!description || !zkpTicketId || !zkpSignature || !citizenPubKey || !signature) {
      throw new BadRequestException('Missing required fields in payload');
    }

    try {
      // STEP 1: Verify Government Ticket
      const recoveredGovAddress = ethers.verifyMessage(
        ethers.getBytes(zkpTicketId),
        zkpSignature
      );

      // Compare against our dynamically fetched govPublicKey
      if (recoveredGovAddress.toLowerCase() !== this.govPublicKey.toLowerCase()) {
         this.logger.error(`Gov signature mismatch. Expected: ${this.govPublicKey}, Got: ${recoveredGovAddress}`);
         throw new UnauthorizedException('Invalid or forged government ticket');
      }

      // STEP 2: Verify Citizen Payload Signature
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'string'],
        [description, zkpTicketId]
      );

      const recoveredCitizenAddress = ethers.verifyMessage(
        ethers.getBytes(messageHash),
        signature
      );

      if (recoveredCitizenAddress.toLowerCase() !== citizenPubKey.toLowerCase()) {
         this.logger.error(`Citizen signature mismatch. Data tampered in transit.`);
         throw new UnauthorizedException('Invalid citizen signature. Payload may be tampered.');
      }

      this.logger.log('✅ Cryptographic verification passed. Payload is secure.');

      // STEP 3: Storage (IPFS)
      const ipfsCID = 'ipfs://QmMockHashForNow12345'; 
      this.logger.log(`IPFS upload mocked: ${ipfsCID}`);

      // STEP 4: AI Moderation
      this.logger.log('AI moderation mocked: content approved');

      // STEP 5: Blockchain Submission
      const txResult = await this.blockchainService.submitReportToChain(
        ipfsCID,
        zkpTicketId
      );

      this.logger.log(`Report successfully processed and sent to chain.`);
      return txResult;

    } catch (error: any) {
      this.logger.error(`Submission pipeline failed: ${error.message}`);
      if (error.status) throw error; 
      throw new BadRequestException('Cryptographic verification or blockchain submission failed');
    }
  }
}