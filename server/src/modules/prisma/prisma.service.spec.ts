import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

describe('PrismaService', () => {
  let service: PrismaService;
  let prismaClient: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    prismaClient = service as unknown as PrismaClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to database on module initialization', async () => {
      const connectSpy = jest.spyOn(prismaClient, '$connect');
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
    });

    it('should handle database connection error', async () => {
      const error = new Error('Failed to connect to database');
      jest.spyOn(prismaClient, '$connect').mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destruction', async () => {
      const disconnectSpy = jest.spyOn(prismaClient, '$disconnect');
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle database disconnection error', async () => {
      const error = new Error('Failed to disconnect from database');
      jest.spyOn(prismaClient, '$disconnect').mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow(error);
    });
  });
}); 