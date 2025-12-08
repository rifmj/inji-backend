import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestCodeDto {
  @ApiProperty({
    type: String,
    example: '79261234567',
    description: 'Номер телефона',
  })
  @IsString()
  readonly phone: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Дебаг-режим',
  })
  @IsOptional()
  readonly debug: boolean;
}
