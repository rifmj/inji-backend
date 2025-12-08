import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const reqUser = await this.authService.getAuthorizedRequestUser(req);
    if (reqUser) {
      req.user = reqUser;
      return true;
    }
    return false;
  }
}
