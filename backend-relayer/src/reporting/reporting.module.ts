import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [BlockchainModule],
  controllers: [ReportingController],
  providers: [ReportingService]
})
export class ReportingModule {}
