import { IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetAdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  clientNumber?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBooleanString({ message: 'isActive phải là chuỗi true hoặc false' })
  isActive?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
