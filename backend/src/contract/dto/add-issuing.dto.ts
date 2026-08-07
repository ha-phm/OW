import { IsOptional, IsString } from 'class-validator';

export class AddIssuingDto {
  @IsOptional()
  @IsString()
  cbsNumber?: string;

  @IsOptional()
  @IsString()
  institutionCode?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  paymentOption?: string;

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
}
