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
  embossedCompanyName?: string;

  @IsString({ message: 'Tên thẻ phải là một chuỗi văn bản' })
  @IsOptional()
  cardName?: string;

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
