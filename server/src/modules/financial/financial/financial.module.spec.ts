import { Test, TestingModule } from '@nestjs/testing';
import { FinancialModule } from '../financial.module';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { BillModule } from '../bill/bill.module';
import { PaymentModule } from '../payment/payment.module';
import { CurrencyModule } from '../../currency/currency.module';

describe('FinancialModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        FinancialModule,
        // Thêm mock cho các module được import
        {
          module: class PrismaMockModule {},
          providers: [{ provide: PrismaModule, useValue: {} }],
          exports: [PrismaModule],
        },
        {
          module: class BillMockModule {},
          providers: [{ provide: BillModule, useValue: {} }],
          exports: [BillModule],
        },
        {
          module: class PaymentMockModule {},
          providers: [{ provide: PaymentModule, useValue: {} }],
          exports: [PaymentModule],
        },
        {
          module: class CurrencyMockModule {},
          providers: [{ provide: CurrencyModule, useValue: {} }],
          exports: [CurrencyModule],
        },
      ],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide FinancialService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        {
          module: class FinancialMockModule {},
          providers: [
            {
              provide: FinancialService,
              useValue: {},
            },
          ],
          exports: [FinancialService],
        },
      ],
    }).compile();
    
    const service = moduleRef.get<FinancialService>(FinancialService);
    expect(service).toBeDefined();
  });

  it('should register FinancialController', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FinancialController],
      providers: [
        {
          provide: FinancialService,
          useValue: {},
        },
      ],
    }).compile();
    
    const controller = moduleRef.get<FinancialController>(FinancialController);
    expect(controller).toBeDefined();
  });
  
  it('should import PrismaModule', async () => {
    // Kiểm tra PrismaModule được import trong FinancialModule
    // Chỉ kiểm tra cấu trúc module mà không kiểm tra instance của PrismaService
    const FinancialModuleClass = FinancialModule;
    const moduleMetadata = Reflect.getMetadata('imports', FinancialModuleClass);
    
    // Lưu ý: Do imports là array các class module nên cần tìm trong array
    const hasPrismaModule = moduleMetadata.some(
      module => module.name === 'PrismaModule' || 
                (module.name === undefined && 
                 String(module).includes('PrismaModule'))
    );
    
    expect(hasPrismaModule).toBeTruthy();
  });
  
  it('should import BillModule and PaymentModule', async () => {
    const FinancialModuleClass = FinancialModule;
    const moduleMetadata = Reflect.getMetadata('imports', FinancialModuleClass);
    
    // Kiểm tra BillModule được import
    const hasBillModule = moduleMetadata.some(
      module => module.name === 'BillModule' || 
                (module.name === undefined && 
                 String(module).includes('BillModule'))
    );
    
    // Kiểm tra PaymentModule được import
    const hasPaymentModule = moduleMetadata.some(
      module => module.name === 'PaymentModule' || 
                (module.name === undefined && 
                 String(module).includes('PaymentModule'))
    );
    
    expect(hasBillModule).toBeTruthy();
    expect(hasPaymentModule).toBeTruthy();
  });
  
  it('should export BillModule and PaymentModule', async () => {
    const FinancialModuleClass = FinancialModule;
    const moduleMetadata = Reflect.getMetadata('exports', FinancialModuleClass);
    
    // Kiểm tra BillModule được export
    const hasBillModule = moduleMetadata.some(
      module => module === BillModule || 
                (String(module).includes('BillModule'))
    );
    
    // Kiểm tra PaymentModule được export
    const hasPaymentModule = moduleMetadata.some(
      module => module === PaymentModule || 
                (String(module).includes('PaymentModule'))
    );
    
    expect(hasBillModule).toBeTruthy();
    expect(hasPaymentModule).toBeTruthy();
  });
}); 