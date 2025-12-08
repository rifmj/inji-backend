import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    type: String,
    example: 'checkout_token',
    description: 'Checkout token',
  })
  @IsString()
  readonly checkoutToken: string;

  @ApiProperty({
    type: String,
    example: 'token',
    description: 'Token',
  })
  @IsString()
  readonly token: string;

  @ApiProperty({
    type: String,
    example: 'gateway',
    description: 'Gateway',
  })
  @IsString()
  readonly gateway: string;
}
