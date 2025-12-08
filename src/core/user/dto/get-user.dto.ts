import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserDto {
  @ApiProperty({
    type: String,
    example: '79261234567',
    description: 'Номер телефона',
  })
  @IsString()
  readonly phone: string;
}
