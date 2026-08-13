import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Base DTO cho các endpoint danh sách có tìm kiếm + phân trang
 * (VD: GET /cards/me, GET /contracts/me). Kế thừa từ đây thay vì
 * khai báo lại 3 field search/page/pageSize ở từng module.
 */
export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;
}
