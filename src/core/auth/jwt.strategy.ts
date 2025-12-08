import { PassportStrategy } from '@nestjs/passport';

const { Strategy, ExtractJwt } = require('passport-jwt');

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload) {
    return { id: payload.sub, user: payload.user };
  }
}
