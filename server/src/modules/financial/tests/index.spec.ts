import { Test, TestingModule } from '@nestjs/testing';
import { FinancialModule } from '../financial.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CurrencyModule } from '../../currency/currency.module';
import { FinancialService } from '../financial/financial.service';
import { FinancialController } from '../financial/financial.controller';
import { BillModule } from '../bill/bill.module';
import { PaymentModule } from '../payment/payment.module';

describe('Financial Modules', () => {
  describe('FinancialModule', () => {
    it('should compile the module', async () => {
      const module = await Test.createTestingModule({
        imports: [FinancialModule, PrismaModule, CurrencyModule],
      }).compile();

      expect(module).toBeDefined();
    });

    it('should provide FinancialService', async () => {
      const module = await Test.createTestingModule({
        imports: [FinancialModule, PrismaModule, CurrencyModule],
      }).compile();

      const service = module.get<FinancialService>(FinancialService);
      expect(service).toBeDefined();
    });

    it('should have FinancialController', async () => {
      const module = await Test.createTestingModule({
        imports: [FinancialModule, PrismaModule, CurrencyModule],
      }).compile();

      const controller = module.get<FinancialController>(FinancialController);
      expect(controller).toBeDefined();
    });

    it('should export BillModule, PaymentModule, and CurrencyModule', async () => {
      // Kiểm tra FinancialModule có export các module này không
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
      
      // Kiểm tra CurrencyModule được export
      const hasCurrencyModule = moduleMetadata.some(
        module => module === CurrencyModule || 
                  (String(module).includes('CurrencyModule'))
      );
      
      expect(hasBillModule).toBeTruthy();
      expect(hasPaymentModule).toBeTruthy();
      expect(hasCurrencyModule).toBeTruthy();
    });
    
    it('should not directly export CurrencyService', async () => {
      const FinancialModuleClass = FinancialModule;
      const moduleMetadata = Reflect.getMetadata('exports', FinancialModuleClass);
      
      // Kiểm tra không có CurrencyService trong exports
      const moduleClassNames = moduleMetadata.map(module => 
        module.name || String(module)
      );
      
      expect(moduleClassNames.some(name => name.includes('CurrencyService'))).toBeFalsy();
    });
  });
}); 