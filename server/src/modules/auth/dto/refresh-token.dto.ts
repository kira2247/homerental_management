import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for the refresh token endpoint
 * 
 * @example
 * {
 *   "refreshToken": "e7c9b76d-af1d-4e9b-8a55-9c19b7a2a7a2"
 * }
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
} 