import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContractDto {
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
  reason?: string;
}
