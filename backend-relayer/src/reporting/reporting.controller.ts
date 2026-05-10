import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Logger,
} from '@nestjs/common';
import { ExpressAdapter, FilesInterceptor } from '@nestjs/platform-express';
import { ReportingService } from './reporting.service';
import type { SubmitReportPayload } from './reporting.service';

type UploadedImage = {
  buffer: Uint8Array;
};

@Controller('report')
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(private readonly reportingService: ReportingService) {}

  @Post()
  // Changed to FilesInterceptor to accept an array of up to 5 files under the field 'images'
  @UseInterceptors(FilesInterceptor('images', 5))
  async createReport(
    @Body() payload: SubmitReportPayload,
    @UploadedFiles() images?: UploadedImage[],
  ) {
    this.logger.log(`Received report creation request for ticket: ${payload.zkpTicketId}`);
    
    if (images?.length) {
      this.logger.log(`Received ${images.length} image(s) with the report.`);
    }

    // Offload all the complex logic to the service layer
    const reportResult = await this.reportingService.createReport(payload, images);

    return {
      success: true,
      message: 'Report successfully validated and accepted.',
      data: reportResult,
    };
  }
}