import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportingService } from './reporting.service';
import type { SubmitReportPayload } from './reporting.service';
@Controller('report')
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(private readonly reportingService: ReportingService) {}

  @Post() 
  @UseInterceptors(FileInterceptor('image'))
  async createReport( // Renamed method
    @Body() payload: SubmitReportPayload,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    this.logger.log(`Received report creation request for ticket: ${payload.zkpTicketId}`);

    // Offload all the complex logic to the service layer
    const txResult = await this.reportingService.createReport(payload, image);

    return {
      success: true,
      message: 'Report successfully validated and recorded on the blockchain.',
      data: txResult,
    };
  }
}