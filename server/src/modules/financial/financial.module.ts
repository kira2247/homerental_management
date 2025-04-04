import { Module } from '@nestjs/common';
import { FinancialService } from './financial/financial.service';
import { FinancialController } from './financial/financial.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillModule } from './bill/bill.module';
import { PaymentModule } from './payment/payment.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [PrismaModule, BillModule, PaymentModule, CurrencyModule],
  providers: [FinancialService],
  controllers: [FinancialController],
  exports: [BillModule, PaymentModule, CurrencyModule]
})
export class FinancialModule {}
