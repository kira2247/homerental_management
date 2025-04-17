import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // Chỉ cho phép các file types được định nghĩa
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
    }),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    CloudinaryProvider,
  ],
  exports: [FilesService],
})
export class FilesModule {} 