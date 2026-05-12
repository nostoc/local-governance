import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
  InternalServerErrorException
} from '@nestjs/common';
import { ethers } from 'ethers';
import { AiOracleService } from '../ai-oracle/ai-oracle.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { IpfsService } from '../ipfs/ipfs.service';

export interface SubmitReportPayload {
  description: string;
  zkpTicketId: string;
  zkpSignature: string;
  citizenPubKey: string;
  signature: string;
  imageHashes: string; 
}



@Injectable()
export class ReportingService implements OnModuleInit {
  private readonly logger = new Logger(ReportingService.name);

  private govPublicKey: string = '';

  constructor(
    private readonly aiOracleService: AiOracleService,
    private readonly blockchainService: BlockchainService,
    private readonly ipfsService: IpfsService,
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

  async createReport(payload: SubmitReportPayload, images?: Express.Multer.File[]) {
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
      const citizenPseudonym = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'string'],
            [citizenPubKey, process.env.PSEUDONYM_DOMAIN_SALT]   // e.g. "CivicReport-v1"
        )
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

// STEP 5: Storage (IPFS) — Actual Implementation
      this.logger.log('Initiating IPFS storage pipeline...');
      let ipfsCID = 'ipfs://none';

      if (images && images.length > 0) {
        this.logger.log(`Uploading ${images.length} approved media file(s) to IPFS...`);
        // Upload multiple images concurrently to minimize latency
        const uploadPromises = images.map((img) => this.ipfsService.uploadImage(img));
        const uploadedCIDs = await Promise.all(uploadPromises);
        
        // Join multiple CIDs with a comma (or adjust based on your smart contract schema)
        ipfsCID = uploadedCIDs.join(',');
        this.logger.log(`✅ Media successfully stored on IPFS. Final CID reference: ${ipfsCID}`);
      } else {
        this.logger.log('No media attached to report; proceeding with fallback CID reference.');
      }

    // STEP 6: Blockchain Submission
    this.logger.log('Submitting report to blockchain...');
    const chainResult = await this.blockchainService.submitReportToChain(
      ipfsCID,
      messageHash,       // this is the solidityPackedKeccak256 hash — already a bytes32 hex string
      zkpTicketId,       // used as the submission nullifier
      citizenPseudonym
    );

    return {
      success: true,
      submissionStatus: 'confirmed_onchain',
      zkpTicketId,
      ipfsCID,
      transactionHash: chainResult.transactionHash,
      blockNumber: chainResult.blockNumber,
    };

    } catch (error: any) {
      this.logger.error(`Submission pipeline failed: ${error.message}`);
      if (error.status) throw error; 
      throw new BadRequestException('Cryptographic verification, AI moderation, or blockchain submission failed');
    }
  }

  getPseudonym(citizenAddress: string): { pseudonym: string } {
    const salt = process.env.PSEUDONYM_DOMAIN_SALT;
 
    if (!salt) {
      this.logger.error('PSEUDONYM_DOMAIN_SALT is not set in environment');
      throw new InternalServerErrorException('Pseudonym derivation is not configured');
    }
 
    const pseudonym = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'string'],
        [citizenAddress, salt],
      ),
    );
 
    this.logger.log(`Pseudonym derived for ${citizenAddress}: ${pseudonym}`);
 
    return { pseudonym };
  }
}