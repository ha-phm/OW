import { IsOptional, IsString } from 'class-validator';

export class CreateLiabilityDto {
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
