/**
 * Creates a mock Prisma service for testing
 */
export function createMockPrismaService() {
  return {
    property: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(5),
    },
    unit: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(8),
    },
    maintenanceRequest: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(3),
    },
    tenantUnit: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(2),
    },
    tenant: {
      count: jest.fn().mockResolvedValue(10),
    },
    bill: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(5),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(15),
      aggregate: jest.fn().mockImplementation(() => {
        return {
          _sum: {
            amount: 5000
          }
        };
      }),
    },
  };
} 