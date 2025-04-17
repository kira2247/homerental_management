import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SupportedCurrency } from './interfaces/currency.interface';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpService: HttpService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockApiResponse = {
    base: 'VND',
    date: '2023-04-07',
    rates: {
      VND: 1,
      USD: 0.000043,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      providers: [
        CurrencyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock HTTP requests
    jest.spyOn(httpService, 'get').mockImplementation(() => {
      return of({
        data: mockApiResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://api.exchangerate-api.com/v4/latest/VND' },
      } as AxiosResponse);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExchangeRates', () => {
    it('should fetch exchange rates', async () => {
      const result = await service.getExchangeRates();
      
      expect(result).toEqual({
        base: SupportedCurrency.VND,
        date: expect.any(String),
        rates: {
          VND: 1,
          USD: 0.000043,
        },
      });
      
      expect(httpService.get).toHaveBeenCalled();
    });

    it('should use cached rates if they exist and are not expired', async () => {
      // First call to get rates
      await service.getExchangeRates();
      
      // Reset the mock to check if it's called again
      jest.clearAllMocks();
      
      // Second call should use cached rates
      await service.getExchangeRates();
      
      // HTTP service should not be called again
      expect(httpService.get).not.toHaveBeenCalled();
    });
  });

  describe('convert', () => {
    it('should convert VND to USD correctly', async () => {
      const result = await service.convert(1000000, SupportedCurrency.VND, SupportedCurrency.USD);
      expect(result).toBeCloseTo(43, 0); // 1,000,000 VND ≈ $43 USD
    });

    it('should convert USD to VND correctly', async () => {
      const result = await service.convert(1, SupportedCurrency.USD, SupportedCurrency.VND);
      expect(result).toBeCloseTo(23255.81, 2); // $1 USD ≈ 23,255.81 VND
    });

    it('should format the result as a string when format option is true', async () => {
      const result = await service.convert(
        1000000, 
        SupportedCurrency.VND, 
        SupportedCurrency.USD, 
        { format: true }
      );
      
      expect(typeof result).toBe('string');
      expect(result).toBe('$43.00');
    });

    it('should return the original amount when source and target currencies are the same', async () => {
      const amount = 1000;
      const result = await service.convert(amount, SupportedCurrency.VND, SupportedCurrency.VND);
      expect(result).toBe(amount);
    });
  });

  describe('formatCurrency', () => {
    it('should format VND currency correctly', () => {
      const result = service.formatCurrency(1500000, SupportedCurrency.VND);
      expect(result).toBe('1.500.000 ₫');
    });

    it('should format USD currency correctly', () => {
      const result = service.formatCurrency(1234.56, SupportedCurrency.USD);
      expect(result).toBe('$1,234.56');
    });

    it('should respect custom decimal places', () => {
      const result = service.formatCurrency(1234.5678, SupportedCurrency.USD, 4);
      expect(result).toBe('$1,234.5678');
    });
  });

  describe('getUserCurrencyPreference', () => {
    it('should return user preference when it exists', async () => {
      const mockPreference = { 
        preferredCurrency: SupportedCurrency.USD, 
        autoConvert: true 
      };
      
      mockPrismaService.user.findUnique.mockResolvedValue({
        currencyPreference: mockPreference
      });
      
      const result = await service.getUserCurrencyPreference('user-id');
      
      expect(result).toEqual(mockPreference);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: { currencyPreference: true }
      });
    });

    it('should return default preference when user has none', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        currencyPreference: null
      });
      
      const result = await service.getUserCurrencyPreference('user-id');
      
      expect(result).toEqual({
        preferredCurrency: SupportedCurrency.VND,
        autoConvert: true,
      });
    });
  });

  describe('setUserCurrencyPreference', () => {
    it('should update and return user currency preference', async () => {
      const mockPreference = { 
        preferredCurrency: SupportedCurrency.USD, 
        autoConvert: true 
      };
      
      mockPrismaService.user.update.mockResolvedValue({
        currencyPreference: mockPreference
      });
      
      const result = await service.setUserCurrencyPreference('user-id', mockPreference);
      
      expect(result).toEqual(mockPreference);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { currencyPreference: mockPreference },
        select: { currencyPreference: true }
      });
    });
  });
});
