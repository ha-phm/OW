import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCardApplicationDto {
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
