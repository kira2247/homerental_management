import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {} 