import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetAdminContractsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  // Lọc theo loại hợp đồng. Để trống = lấy tất cả.
  @IsOptional()
  @IsIn(['LIABILITY', 'ISSUING'])
  type?: 'LIABILITY' | 'ISSUING';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}
