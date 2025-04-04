import { Body, Controller, Get, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ConvertCurrencyDto, CurrencyPreferenceResponseDto, SetCurrencyPreferenceDto, UpdateExchangeRateDto } from './dto';
import { SupportedCurrency } from './interfaces/currency.interface';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get current exchange rates' })
  @ApiResponse({ status: 200, description: 'Current exchange rates' })
  async getExchangeRates() {
    return this.currencyService.getExchangeRates();
  }

  @Post('convert')
  @HttpCode(200)
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiResponse({ status: 200, description: 'Converted amount' })
  async convertCurrency(@Body() convertDto: ConvertCurrencyDto) {
    return this.currencyService.convert(
      convertDto.amount,
      convertDto.from,
      convertDto.to,
      {
        format: convertDto.format,
        decimals: convertDto.decimals,
      }
    );
  }

  @Put('rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update exchange rates (admin only)' })
  @ApiResponse({ status: 200, description: 'Updated exchange rates' })
  updateExchangeRates(@Body() updateRatesDto: UpdateExchangeRateDto) {
    return this.currencyService.updateExchangeRates(updateRatesDto);
  }

  @Get('preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user currency preference' })
  @ApiResponse({ 
    status: 200, 
    description: 'User currency preference',
    type: CurrencyPreferenceResponseDto
  })
  async getUserCurrencyPreference(@Req() req: RequestWithUser) {
    return this.currencyService.getUserCurrencyPreference(req.user.id);
  }

  @Put('preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set user currency preference' })
  @ApiResponse({ 
    status: 200, 
    description: 'Updated user currency preference',
    type: CurrencyPreferenceResponseDto
  })
  async setUserCurrencyPreference(
    @Req() req: RequestWithUser,
    @Body() preference: SetCurrencyPreferenceDto
  ) {
    return this.currencyService.setUserCurrencyPreference(req.user.id, {
      preferredCurrency: preference.preferredCurrency,
      autoConvert: preference.autoConvert ?? true,
    });
  }

  @Get('supported')
  @ApiOperation({ summary: 'Get supported currencies' })
  @ApiResponse({ status: 200, description: 'List of supported currencies' })
  getSupportedCurrencies() {
    // Return all values from SupportedCurrency enum
    return Object.values(SupportedCurrency);
  }
}
