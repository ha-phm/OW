import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  issuingContractNumber!: string;

  @IsString()
  @MinLength(1)
  productCode!: string;

  @IsOptional()
  @IsString()
  cardName?: string;

  @IsString()
  @MinLength(1)
  embossedFirstName!: string;

  @IsString()
  @MinLength(1)
  embossedLastName!: string;

  @IsOptional()
  @IsString()
  embossedCompanyName?: string;
}
