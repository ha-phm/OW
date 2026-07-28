import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFullCardDto {
  @IsString()
  @MinLength(1)
  clientNumber!: string;

  @IsString()
  @MinLength(1)
  liabProductCode!: string; // Mã hợp đồng Liability (ví dụ: ISS_CR_P_LIB)

  @IsString()
  @MinLength(1)
  issuingProductCode!: string; // Mã thẻ Issuing (ví dụ: MC_CR_GLD)

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

  // -- Thông tin thanh toán (tuỳ chọn) --
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

  @IsString()
  @IsNotEmpty()
  cardProductCode!: string; // Mã sản phẩm thẻ (VD: MC_CR_GLD_M)

  @IsString()
  @MinLength(1)
  embossedFirstName!: string;

  @IsString()
  @MinLength(1)
  embossedLastName!: string;

  @IsOptional()
  @IsString()
  embossedCompanyName?: string;
  cardName: string | undefined;
}
