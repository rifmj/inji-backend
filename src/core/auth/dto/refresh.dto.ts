import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({
    type: String,
    example: 'ckypueonp000009l71c95h3j8',
    description: 'Идентификатор пользователя',
  })
  @IsString()
  readonly userId: string;

  @ApiProperty({
    type: String,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJja3lybmx3eHYwMDA2Mm9veGt3eHFicTdxIiwiZXhwIjoxNjc0NTAyMTIzLjQwOSwiaWF0IjoxNjQyOTY2MTIzfQ.EY_uBAHHGSiOX-VUyfNIxTO3pgG4aeXrMdX1fSdwIlQ',
    description: 'Refresh-токен пользователя',
  })
  @IsString()
  readonly refresh: string;
}
