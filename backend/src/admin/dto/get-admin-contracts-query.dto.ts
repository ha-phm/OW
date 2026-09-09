import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ContractType } from '@prisma/client';

export class GetAdminContractsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @IsString()
  contractName?: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsEnum(ContractType, {
    message: 'Type chỉ có thể là LIABILITY hoặc ISSUING',
  })
  type?: ContractType;

  @IsOptional()
  @IsString()
  userIsActive?: string;

  @IsOptional()
  @IsIn([
    'contractNumber',
    'contractName',
    'type',
    'productCode',
    'clientNumber',
    'userEmail',
    'createdAt',
    'userIsActive',
  ])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
