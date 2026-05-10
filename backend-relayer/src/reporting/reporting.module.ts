import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { AiOracleService } from 'src/ai-oracle/ai-oracle.service';

@Module({
  imports: [BlockchainModule],
  controllers: [ReportingController],
  providers: [ReportingService, AiOracleService]
})
export class ReportingModule {}
