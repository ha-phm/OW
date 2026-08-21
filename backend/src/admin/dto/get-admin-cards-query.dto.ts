import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'; // Sửa lại đường dẫn này nếu cần

export class GetAdminCardsQueryDto extends PaginationQueryDto {
  // Thêm các trường này vào để NestJS không chặn request nữa
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardName?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;
}
