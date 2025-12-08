import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    type: String,
    example: 'ckypueonp000009l71c95h3j8',
    description: 'Идентификатор пользователя',
  })
  @IsString()
  readonly userId: string;

  @ApiProperty({
    type: String,
    example: '123456',
    description: 'Код из смс',
  })
  @IsString()
  readonly code: string;
}
