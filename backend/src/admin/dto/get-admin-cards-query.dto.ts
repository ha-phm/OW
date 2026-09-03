import { IsIn, IsOptional, IsString, IsBooleanString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetAdminCardsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardName?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsBooleanString()
  userIsActive?: string;

  @IsOptional()
  @IsIn([
    'cardNumber',
    'cardName',
    'issuingContractNumber',
    'userEmail',
    'expiryDate',
    'createdAt',
    'userIsActive',
  ])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
