import { IsOptional, IsString } from 'class-validator';

export class EditCardDto {
  @IsOptional() @IsString() cardName?: string;
  @IsOptional() @IsString() embossedFirstName?: string;
  @IsOptional() @IsString() embossedLastName?: string;
  @IsOptional() @IsString() embossedCompanyName?: string;
}
