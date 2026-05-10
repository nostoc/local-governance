import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { AiOracleService } from '../ai-oracle/ai-oracle.service';
// import { IpfsService } from '../ipfs/ipfs.service';

export interface SubmitReportPayload {
  description: string;
  zkpTicketId: string;
  zkpSignature: string;
  citizenPubKey: string;
  signature: string;
  imageHashes: string; 
}

type UploadedImage = {
  buffer: Uint8Array;
};

@Injectable()
export class ReportingService implements OnModuleInit {
  private readonly logger = new Logger(ReportingService.name);

  private govPublicKey: string = '';

  constructor(
    private readonly aiOracleService: AiOracleService,
    // private readonly ipfsService: IpfsService,
  ) {}

  async onModuleInit() {
    this.loadGovPublicKeyFromEnv();
  }

  private loadGovPublicKeyFromEnv() {
    const govPublicAddress = process.env.GOV_PUBLIC_ADDRESS;

    if (!govPublicAddress) {
      const message = 'Missing GOV_PUBLIC_ADDRESS in environment configuration';
      this.logger.error(message);
      throw new Error(message);
    }

    this.govPublicKey = govPublicAddress;
    this.logger.log(`Loaded Government Public Address from .env: ${this.govPublicKey}`);
  }

  async createReport(payload: SubmitReportPayload, images?: UploadedImage[]) {
    const { description, zkpTicketId, zkpSignature, citizenPubKey, signature, imageHashes } = payload;

    if (!description || !zkpTicketId || !zkpSignature || !citizenPubKey || !signature) {
      throw new BadRequestException('Missing required fields in payload');
    }

    try {
      // STEP 1: Verify Government Ticket
      const recoveredGovAddress = ethers.verifyMessage(
        ethers.getBytes(zkpTicketId),
        zkpSignature
      );

      if (recoveredGovAddress.toLowerCase() !== this.govPublicKey.toLowerCase()) {
         this.logger.error(`Gov signature mismatch. Expected: ${this.govPublicKey}, Got: ${recoveredGovAddress}`);
         throw new UnauthorizedException('Invalid or forged government ticket');
      }

      // STEP 2: Parse and Verify Image Hashes
      let parsedImageHashes: string[] = [];
      if (imageHashes) {
        try {
          parsedImageHashes = JSON.parse(imageHashes);
        } catch (e) {
          throw new BadRequestException('Invalid imageHashes format. Expected JSON array.');
        }
      }

      if (images && images.length > 0) {
        if (images.length !== parsedImageHashes.length) {
          throw new BadRequestException('Mismatch between uploaded images count and provided hashes.');
        }

        for (let i = 0; i < images.length; i++) {
          const computedHash = ethers.keccak256(images[i].buffer);
          if (computedHash !== parsedImageHashes[i]) {
             this.logger.error(`Image hash mismatch at index ${i}. Possible tampering.`);
             throw new UnauthorizedException(`Image at index ${i} tampered in transit or hash mismatch.`);
          }
        }
      }

      // STEP 3: Verify Citizen Payload Signature
      const combinedImageHashes = parsedImageHashes.join("");
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'string', 'string'],
        [description, zkpTicketId, combinedImageHashes]
      );

      const recoveredCitizenAddress = ethers.verifyMessage(
        ethers.getBytes(messageHash),
        signature
      );

      if (recoveredCitizenAddress.toLowerCase() !== citizenPubKey.toLowerCase()) {
         this.logger.error(`Citizen signature mismatch. Data tampered in transit.`);
         throw new UnauthorizedException('Invalid citizen signature. Payload may be tampered.');
      }

      this.logger.log('✅ Cryptographic verification passed. Payload and images are secure.');

      // STEP 4: AI Moderation
      this.logger.log('Initiating AI moderation...');
      const aiVerdict = await this.aiOracleService.moderateContent(
        description,
        images,
        zkpTicketId,
        signature,
        zkpSignature,
        messageHash // We pass the solidityPacked message hash as the payload_hash
      );

      if (!aiVerdict.isApproved) {
        this.logger.warn(`Report rejected by AI. Reason: ${aiVerdict.reason}`);
        throw new BadRequestException(`Content rejected by AI moderation: ${aiVerdict.reason || 'Violates community guidelines'}`);
      }
      this.logger.log('✅ AI moderation passed: Content approved.');

      // STEP 5: Storage (IPFS)
      // const ipfsCID = await this.ipfsService.uploadFiles(description, images);
      const ipfsCID = 'ipfs://QmMockHashForNow12345'; 
      this.logger.log(`IPFS upload mocked: ${ipfsCID}`);

      // STEP 6: Blockchain Submission (temporarily disabled)
      this.logger.warn('Blockchain submission is temporarily disabled. Returning success after AI moderation.');
      return {
        success: true,
        submissionStatus: 'accepted_offchain',
        zkpTicketId,
        ipfsCID,
      };

    } catch (error: any) {
      this.logger.error(`Submission pipeline failed: ${error.message}`);
      if (error.status) throw error; 
      throw new BadRequestException('Cryptographic verification, AI moderation, or blockchain submission failed');
    }
  }
}