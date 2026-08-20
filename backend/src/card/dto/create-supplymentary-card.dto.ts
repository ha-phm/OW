import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplementaryCardDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cardName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên in nổi không được để trống' })
  @MaxLength(20)
  embossedFirstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ in nổi không được để trống' })
  @MaxLength(20)
  embossedLastName!: string;
}
