import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckCodeDto {
  @ApiProperty({
    type: String,
    example: '79261234567',
    description: 'Номер телефона',
  })
  @IsString()
  readonly phone: string;

  @ApiProperty({
    type: String,
    example: '1234',
    description: 'Код авторизации',
  })
  @IsString()
  readonly code: string;
}
