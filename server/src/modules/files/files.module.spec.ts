import { Test, TestingModule } from '@nestjs/testing';
import { FilesModule } from './files.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

describe('FilesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        MulterModule.register({
          dest: './uploads',
        }),
        FilesModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide FilesController', () => {
    const controller = module.get<FilesController>(FilesController);
    expect(controller).toBeDefined();
  });

  it('should provide FilesService', () => {
    const service = module.get<FilesService>(FilesService);
    expect(service).toBeDefined();
  });
}); 