import { Test } from '@nestjs/testing';
import { PropertyModule } from './property.module';

describe('PropertyModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [PropertyModule],
    }).compile();

    expect(module).toBeDefined();
  });
}); 