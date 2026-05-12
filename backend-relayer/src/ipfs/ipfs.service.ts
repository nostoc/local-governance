import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import FormData from 'form-data';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);

  
  // Ideally, load this from process.env.IPFS_UPLOAD_ENDPOINT
  private readonly ipfsEndpoint = 'https://ipfs.internalbuildtools.online/api/ipfs/store';

  /**
   * Uploads an image buffer to the external IPFS node via multipart/form-data POST.
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const formData = new FormData();
      
      // When attaching buffers in Node, you MUST specify the filename and content type,
      // otherwise the receiving server may fail to parse the multipart request.
      formData.append('image', file.buffer, {
        filename: file.originalname || 'upload.jpg',
        contentType: file.mimetype || 'image/webp',
      });

      this.logger.log(`Uploading ${file.originalname || 'image'} to IPFS node...`);

      const response = await axios.post(this.ipfsEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        // Optional: Add a timeout so slow IPFS nodes don't hang your pipeline
        timeout: 30000, 
      });

      // Map the CID based on what your API returns. 
      // Adjust response.data.cid to .hash or .url depending on the exact JSON schema of your endpoint.
      const cid = response.data?.cid || response.data?.hash || response.data?.url;

      if (!cid) {
        this.logger.warn(`Upload succeeded but couldn't extract CID. Full response: ${JSON.stringify(response.data)}`);
        // Fallback: return the raw string response if it's not a JSON object
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }

      this.logger.log(`✅ Successfully uploaded to IPFS: ${cid}`);
      
      // Ensure standard IPFS URI formatting
      return cid.startsWith('ipfs://') ? cid : `ipfs://${cid}`;
    } catch (error: any) {
      this.logger.error(`IPFS upload failed: ${error?.response?.data || error.message}`);
      throw new HttpException(
        'Failed to store image on IPFS network',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Optional Helper: Uploads a JSON metadata object to IPFS.
   * Useful if your blockchain contract expects a single metadata URI containing the description + image links.
   */
  async uploadMetadata(metadata: Record<string, any>): Promise<string> {
    // Implement if your API endpoint supports raw JSON uploads (e.g., /api/ipfs/store-json)
    throw new Error('Method not implemented.');
  }
}