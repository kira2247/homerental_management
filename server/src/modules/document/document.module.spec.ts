import { Test, TestingModule } from '@nestjs/testing';
import { DocumentModule } from './document.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';

describe('DocumentModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DocumentModule, PrismaModule, FilesModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide DocumentController', () => {
    const controller = module.get<DocumentController>(DocumentController);
    expect(controller).toBeDefined();
  });

  it('should provide DocumentService', () => {
    const service = module.get<DocumentService>(DocumentService);
    expect(service).toBeDefined();
  });
}); 