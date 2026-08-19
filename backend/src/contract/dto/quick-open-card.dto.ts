// dto/quick-open-card.dto.ts
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CardCategory } from '../contract.constants';

export class QuickOpenCardDto {
  @IsEnum(CardCategory)
  cardCategory!: CardCategory;

  // --- Thông tin in nổi trên thẻ ---
  @IsString()
  @MinLength(1)
  embossedFirstName!: string;

  @IsString()
  @MinLength(1)
  embossedLastName!: string;

  @IsOptional()
  @IsString()
  embossedCompanyName?: string; // Tên công ty in nổi (nếu thẻ doanh nghiệp)

  // --- Thông tin ngân hàng — chỉ thực sự cần ở LẦN MỞ THẺ ĐẦU TIÊN
  // (vì Issuing Contract chỉ tạo 1 lần, các lần mở thẻ sau bỏ qua các field này) ---
  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  account?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  accName?: string;

  @IsOptional()
  @IsString()
  paymentOption?: string;

  @IsOptional()
  @IsString()
  cbsNumber?: string;

  @IsOptional()
  @IsString()
  institutionCode?: string;

  @IsOptional()
  @IsString()
  branch?: string;
}
