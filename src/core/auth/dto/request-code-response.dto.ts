import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestCodeResponseDto {
  @ApiProperty({
    type: String,
    example: 'ckypueonp000009l71c95h3j8',
    description: 'Идентификатор пользователя',
  })
  @IsString()
  @IsOptional()
  readonly userId: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Удален ли аккаунт',
  })
  @IsString()
  @IsOptional()
  readonly isDeleted: boolean;
}
