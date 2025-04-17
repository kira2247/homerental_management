import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('api/health')
  async getHealth() {
    let dbStatus = 'UP';
    let dbMessage = 'Database connection successful';
    
    try {
      // Kiểm tra kết nối tới database
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'DOWN';
      dbMessage = `Database connection failed: ${error.message}`;
    }
    
    const appStatus = 'UP';
    const isHealthy = dbStatus === 'UP';
    
    return {
      status: isHealthy ? 'UP' : 'PARTIAL',
      timestamp: new Date().toISOString(),
      components: {
        app: {
          status: appStatus,
          message: 'Application is running',
        },
        database: {
          status: dbStatus,
          message: dbMessage,
        },
      },
      message: isHealthy 
        ? 'All systems operational'
        : 'System is partially operational - database may be unavailable',
    };
  }
} 