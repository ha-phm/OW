import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsOptional()
  @IsString()
  branch?: string;

  @IsString()
  socialSecurityNumber!: string;

  @IsOptional()
  @IsString()
  individualTaxpayerNumber?: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsDateString()
  birthDate!: string;

  @IsIn(['M', 'F'])
  gender!: 'M' | 'F';

  @IsIn(['S', 'M', 'D', 'W'])
  maritalStatusCode!: string;

  @IsIn(['MR', 'MRS', 'MS'])
  salutationCode!: string;

  @IsString()
  mobilePhone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  identityCardNumber!: string;

  @IsOptional()
  @IsString()
  identityCardDetails?: string;

  @IsString()
  addressLine1!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  clientNumber?: string;

  @IsOptional()
  @IsString()
  citizenship?: string;
}
