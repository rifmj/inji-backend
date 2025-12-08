import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const reqUser = await this.authService.getAuthorizedRequestUser(req);
    if (reqUser) {
      if (reqUser?.account?.type !== 'Admin') {
        return false;
      }
      req.user = reqUser;
      return true;
    }
    return false;
  }
}
