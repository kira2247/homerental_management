import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertyModule } from './modules/property/property.module';
import { UnitModule } from './modules/unit/unit.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DocumentModule } from './modules/document/document.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FilesModule } from './modules/files/files.module';
import { MailModule } from './modules/mail/mail.module';
import { CurrencyModule } from './modules/currency/currency.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available throughout the application
      envFilePath: '.env',
    }),
    // Application modules
    PrismaModule,
    UsersModule,
    AuthModule,
    PropertyModule,
    UnitModule,
    TenantModule,
    FinancialModule,
    DocumentModule,
    MaintenanceModule,
    FilesModule,
    MailModule,
    CurrencyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 