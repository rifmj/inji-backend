import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JwtDto {
  @ApiProperty({
    type: String,
    example: '123456',
    description: 'JWT',
  })
  @IsString()
  readonly jwt: string;
}
