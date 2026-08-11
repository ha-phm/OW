import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ContractService,
  ContractResponse,
  CardApplicationResponse,
  ContractTreeLiability,
  PaginatedResult,
} from './contract.service';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { AddIssuingDto } from './dto/add-issuing.dto';
import { CreateCardApplicationDto } from './dto/create-card-application.dto';
import { GetContractDetailDto } from './dto/get-contract-detail.dto';
import { GetContractTreeQueryDto } from './dto/get-contract-tree-query.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    clientId?: string | null;
    clientNumber?: string | null;
  };
}

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  // Hỗ trợ tìm kiếm + phân trang: GET /contracts/me?search=&page=&pageSize=
  // Query params được validate/transform bởi GetContractTreeQueryDto (yêu cầu
  // main.ts đã bật ValidationPipe({ transform: true }) toàn cục).
  @Get('me')
  getMyContractTree(
    @Request() req: RequestWithUser,
    @Query() query: GetContractTreeQueryDto,
  ): Promise<PaginatedResult<ContractTreeLiability>> {
    if (!req.user.clientId) {
      return Promise.resolve({
        data: [],
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
        },
      });
    }
    return this.contractService.getMyContractTreePaginated(
      req.user.clientId,
      req.user.userId,
      query,
    );
  }

  // LƯU Ý: route ':contractNumber' phải luôn đứng SAU mọi route tĩnh 1-segment
  // khác trong controller này (như 'me' ở trên) — nếu không route tĩnh sẽ bị
  // route động này "nuốt" mất tuỳ theo thứ tự khai báo.
  @Get(':contractNumber')
  getContract(
    @Request() req: RequestWithUser,
    @Param('contractNumber') contractNumber: string,
  ): Promise<GetContractDetailDto> {
    // Trước đây endpoint này gọi thẳng WAY4 theo contractNumber trên URL mà
    // KHÔNG kiểm tra quyền sở hữu -> user A có thể xem hợp đồng của user B chỉ
    // bằng cách đổi số trên URL. Đã fix: bắt buộc truyền userId để service kiểm
    // tra hợp đồng có thuộc về user hiện tại (Liability/Issuing trong bảng
    // Contract, hoặc Card trong bảng Card) trước khi gọi WAY4.
    return this.contractService.getContract(contractNumber, req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/:clientNumber')
  getContractTreeForAdmin(
    @Param('clientNumber') clientNumber: string,
  ): Promise<ContractTreeLiability[]> {
    return this.contractService.getContractTreeByClientNumber(clientNumber);
  }

  @Post()
  createLiability(
    @Request() req: RequestWithUser,
    @Body() dto: CreateLiabilityDto,
  ): Promise<ContractResponse> {
    if (!req.user.clientId) {
      throw new BadRequestException('Bạn cần tạo hồ sơ khách hàng trước.');
    }
    return this.contractService.createLiabilityForUserByClientId(
      req.user.userId,
      req.user.clientId,
      dto,
    );
  }

  @Post(':liabilityContractNumber/issuing')
  addIssuing(
    @Request() req: RequestWithUser,
    @Param('liabilityContractNumber') liabilityContractNumber: string,
    @Body() dto: AddIssuingDto,
  ): Promise<ContractResponse> {
    return this.contractService.addIssuingUnderLiability(
      req.user.userId,
      liabilityContractNumber,
      dto,
    );
  }

  @Post(':issuingContractNumber/cards')
  addCard(
    @Request() req: RequestWithUser,
    @Param('issuingContractNumber') issuingContractNumber: string,
    @Body() dto: CreateCardApplicationDto,
  ): Promise<CardApplicationResponse> {
    return this.contractService.addCardUnderIssuing(
      req.user.userId,
      issuingContractNumber,
      dto,
    );
  }
}
