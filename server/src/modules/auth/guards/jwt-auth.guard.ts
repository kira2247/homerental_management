import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Thực hiện xác thực JWT tiêu chuẩn
    return super.canActivate(context);
  }
  
  handleRequest(err, user, info) {
    // Xử lý lỗi xác thực một cách an toàn, hạn chế logging thông tin nhạy cảm
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    
    return user;
  }
} 