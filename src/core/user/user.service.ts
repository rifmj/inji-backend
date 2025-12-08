import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async getUserForRequest({ sessionId }: { sessionId: string }): Promise<any> {
    const cachedValue = null;
    if (cachedValue) {
      return cachedValue;
    } else {
      const session = await this.prismaService.session.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (session?.isRevoked) {
        return null;
      }
      const userInfo = await this.prismaService.user.findUnique({
        where: {
          id: session.userId,
        },
      });
      return { ...userInfo, sessionId };
    }
  }

  async updateUserRefreshToken(
    userId: string,
    {
      hashedRefreshToken,
    }: {
      hashedRefreshToken: string;
    },
  ) {
    return this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken,
      },
    });
  }

  public async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    return this.updateUserRefreshToken(userId, {
      hashedRefreshToken: currentHashedRefreshToken,
    });
  }
}
