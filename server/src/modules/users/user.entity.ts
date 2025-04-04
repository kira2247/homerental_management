import { Exclude } from 'class-transformer';
import { Role } from '@prisma/client';

// Sử dụng trực tiếp enum Role từ Prisma
export type UserRole = Role;

export class User {
  id: string;
  
  email: string;
  
  name: string;
  
  @Exclude()
  passwordHash: string;
  
  role: UserRole;
  
  phone?: string;
  
  // Email verification
  emailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyExpires?: Date;
  
  // Password reset
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  
  // Account security status
  isActive: boolean;
  isLocked: boolean;
  lockedUntil?: Date;
  failedLoginAttempts: number;
  
  // Login tracking
  lastLoginAt?: Date;
  lastLoginIp?: string;
  lastUserAgent?: string;
  lastFailedLoginAt?: Date;
  lastPasswordChangeAt?: Date;
  
  createdAt: Date;
  
  updatedAt: Date;
  
  constructor(partial: Partial<User> | any) {
    Object.assign(this, partial);
    
    // Ensure proper type for role field
    if (partial && partial.role) {
      this.role = partial.role;
    }
  }
  
  /**
   * Get safe user data for responses (without sensitive info)
   */
  toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      phone: this.phone,
      emailVerified: this.emailVerified,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 