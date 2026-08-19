// dto/create-card-application.dto.ts
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CardCategory } from '../contract.constants';

export class CreateCardApplicationDto {
  @IsEnum(CardCategory)
  cardCategory!: CardCategory;

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
