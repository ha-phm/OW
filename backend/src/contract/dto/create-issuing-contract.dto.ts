import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateIssuingContractDto {
  @IsString()
  @MinLength(1)
  liabContractNumber!: string;

  @IsOptional()
  @IsIn(['Y', 'N'])
  liabCategory?: string;

  @IsString()
  @MinLength(1)
  clientNumber!: string;

  @IsString()
  @MinLength(1)
  productCode!: string;

  @IsString()
  @MinLength(1)
  contractName!: string;

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
