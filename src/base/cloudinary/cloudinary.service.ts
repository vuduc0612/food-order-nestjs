import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as Multer from 'multer';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Multer.File): Promise<CloudinaryResponse> {
    try {
      return new Promise<CloudinaryResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(file.buffer);
      });
    } catch (error) {
      throw new Error(`Error uploading image to Cloudinary: ${error.message}`);
    }
  }
}
