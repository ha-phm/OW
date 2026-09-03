import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

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
  @IsString()
  type?: string;

  // 1. THÊM BIẾN HỨNG TRẠNG THÁI
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
    'userIsActive', // 2. CHO PHÉP SORT THEO CỘT NÀY
  ])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
