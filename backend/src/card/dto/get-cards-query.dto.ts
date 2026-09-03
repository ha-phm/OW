import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetCardsQueryDto extends PaginationQueryDto {
  pageSize: number = 9;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardName?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  // THÊM 2 TRƯỜNG NÀY VÀO ĐỂ KHÔNG BỊ LỖI 400
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
