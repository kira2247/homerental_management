import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { SupportedCurrency } from './interfaces/currency.interface';

describe('CurrencyController', () => {
  let controller: CurrencyController;
  let currencyService: CurrencyService;

  // Mock the request object for auth endpoints
  const mockRequest = {
    user: {
      id: 'user-id',
      email: 'test@example.com',
      role: 'OWNER',
    },
  };

  // Mock implementation of CurrencyService
  const mockCurrencyService = {
    getExchangeRates: jest.fn(),
    convert: jest.fn(),
    updateExchangeRates: jest.fn(),
    getUserCurrencyPreference: jest.fn(),
    setUserCurrencyPreference: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
      ],
    }).compile();

    controller = module.get<CurrencyController>(CurrencyController);
    currencyService = module.get<CurrencyService>(CurrencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getExchangeRates', () => {
    it('should call currencyService.getExchangeRates', async () => {
      const mockRates = {
        base: SupportedCurrency.VND,
        date: '2023-04-07',
        rates: { VND: 1, USD: 0.000043 },
      };
      
      mockCurrencyService.getExchangeRates.mockResolvedValue(mockRates);
      
      const result = await controller.getExchangeRates();
      
      expect(result).toBe(mockRates);
      expect(currencyService.getExchangeRates).toHaveBeenCalled();
    });
  });

  describe('convertCurrency', () => {
    it('should call currencyService.convert with correct parameters', async () => {
      const convertDto = {
        amount: 1000000,
        from: SupportedCurrency.VND,
        to: SupportedCurrency.USD,
        format: true,
        decimals: 2,
      };
      
      const mockResult = '$43.00';
      mockCurrencyService.convert.mockResolvedValue(mockResult);
      
      const result = await controller.convertCurrency(convertDto);
      
      expect(result).toBe(mockResult);
      expect(currencyService.convert).toHaveBeenCalledWith(
        convertDto.amount,
        convertDto.from,
        convertDto.to,
        {
          format: convertDto.format,
          decimals: convertDto.decimals,
        }
      );
    });
  });

  describe('updateExchangeRates', () => {
    it('should call currencyService.updateExchangeRates with correct parameters', () => {
      const updateDto = {
        base: SupportedCurrency.VND,
        rates: { VND: 1, USD: 0.000043 },
      };
      
      const mockResult = {
        base: SupportedCurrency.VND,
        date: '2023-04-07',
        rates: { VND: 1, USD: 0.000043 },
      };
      
      mockCurrencyService.updateExchangeRates.mockReturnValue(mockResult);
      
      const result = controller.updateExchangeRates(updateDto);
      
      expect(result).toBe(mockResult);
      expect(currencyService.updateExchangeRates).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('getUserCurrencyPreference', () => {
    it('should call currencyService.getUserCurrencyPreference with user id', async () => {
      const mockPreference = {
        preferredCurrency: SupportedCurrency.USD,
        autoConvert: true,
      };
      
      mockCurrencyService.getUserCurrencyPreference.mockResolvedValue(mockPreference);
      
      const result = await controller.getUserCurrencyPreference(mockRequest as any);
      
      expect(result).toBe(mockPreference);
      expect(currencyService.getUserCurrencyPreference).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('setUserCurrencyPreference', () => {
    it('should call currencyService.setUserCurrencyPreference with user id and preference', async () => {
      const preference = {
        preferredCurrency: SupportedCurrency.USD,
        autoConvert: true,
      };
      
      const mockResult = {
        preferredCurrency: SupportedCurrency.USD,
        autoConvert: true,
      };
      
      mockCurrencyService.setUserCurrencyPreference.mockResolvedValue(mockResult);
      
      const result = await controller.setUserCurrencyPreference(mockRequest as any, preference);
      
      expect(result).toBe(mockResult);
      expect(currencyService.setUserCurrencyPreference).toHaveBeenCalledWith(
        mockRequest.user.id,
        {
          preferredCurrency: preference.preferredCurrency,
          autoConvert: preference.autoConvert,
        }
      );
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return all supported currencies', () => {
      const result = controller.getSupportedCurrencies();
      expect(result).toEqual(Object.values(SupportedCurrency));
    });
  });
});
