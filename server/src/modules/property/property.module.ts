import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
