import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: (req) => {
        if (req && req.cookies) {
          return req.cookies['auth_token'];
        }
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-key-please-change-in-production',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new UnauthorizedException('Token has expired');
    }

    try {
      // Tìm người dùng trong database dựa trên sub (user id) từ token
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is disabled');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }
} 