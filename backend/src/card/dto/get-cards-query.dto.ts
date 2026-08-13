import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetCardsQueryDto extends PaginationQueryDto {
  pageSize: number = 9;
}
