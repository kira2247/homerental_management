import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  UseGuards, 
  BadRequestException, 
  Delete, 
  Param,
  Query,
  ParseEnumPipe,
  Optional,
  Get,
  Body,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth, ApiParam, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileType } from '@prisma/client';
import { Express } from 'express';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('type', new ParseEnumPipe(FileType)) fileType: FileType,
    @Query('folderId') folderId?: string,
  ) {
    try {
      return await this.filesService.uploadFile(file, fileType, folderId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiParam({ name: 'provider', description: 'Storage provider (always cloudinary)' })
  async deleteFile(
    @Param('id') id: string,
    @Param('provider') provider: string,
  ) {
    try {
      await this.filesService.deleteFile(id, provider);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Get file URL' })
  @ApiResponse({ status: 200, description: 'File URL retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiParam({ name: 'provider', description: 'Storage provider (always cloudinary)' })
  async getFileUrl(
    @Param('id') id: string,
    @Param('provider') provider: string,
  ) {
    try {
      return await this.filesService.getFileUrl(id, provider);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
} 