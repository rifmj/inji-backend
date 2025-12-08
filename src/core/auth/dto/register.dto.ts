import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    type: String,
    example: '79261234567',
    description: 'Номер телефона',
  })
  @IsString()
  readonly phone: string;

  @ApiProperty({
    type: String,
    example: '123456',
    description: 'Код проверки',
  })
  @IsString()
  readonly code: string;
}

export class RegisterLogToDto {
  @ApiProperty({
    type: String,
    example: 'yRBb5cGfQ6EW',
    description: 'Идентификатор пользователя',
  })
  @IsString()
  readonly userId: string;
}
