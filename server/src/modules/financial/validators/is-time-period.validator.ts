import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { TimePeriod } from '../interfaces/chart-data.interface';

/**
 * Custom validator để kiểm tra nếu một string là TimePeriod hợp lệ
 */
export function IsTimePeriod(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimePeriod',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Danh sách TimePeriod hợp lệ
          const validPeriods: string[] = ['day', 'week', 'month', 'quarter', 'year'];
          return typeof value === 'string' && validPeriods.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid time period (day, week, month, quarter, year)`;
        },
      },
    });
  };
} 