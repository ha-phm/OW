import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from '../client/client.service';
import { CardService } from '../card/card.service';
import { ContractWay4Service } from './contract-way4.service';
import {
  ContractTreeService,
  ContractTreeLiability,
} from './contract-tree.service';
import { GetContractDetailDto } from './interfaces/contract-detail.interface';
import { GetContractTreeQueryDto } from './dto/get-contract-tree-query.dto';
import { splitWay4Field } from './contract.constants';
import {
  asRecord,
  toNumberOrUndefined,
} from '../common/utils/way4-response.util';
import {
  buildMeta,
  PaginatedResult,
} from '../common/interfaces/paginated-result.interface';
import { ContractType } from '@prisma/client/wasm';
import { GetAdminContractsQueryDto } from '../admin/dto/get-admin-contracts-query.dto';
import {
  buildContractOrderBy,
  buildContractWhere,
} from './helpers/contract-query.helper';

// Interface trả về cho Frontend
export interface CardApplicationResponse {
  success: boolean;
  message: string;
  liabContract?: string;
  issuingContract?: string;
  cardPan: string;
  expiryDate: string;
}
interface Way4ContractDetailRecord {
  ContractNumber?: string;
  ContractName?: string;
  Status?: string;
  StatusCode?: string;
  ProductCode?: string;
  Product?: string;
  Currency?: string;
  CreditLimit?: string | number;
  Available?: string | number;
  Balance?: string | number;
  TotalDue?: string | number;
  PastDue?: string | number;
  PastDueDays?: string | number;
  OpenDate?: string;
  LastBillingDate?: string;
  NextBillingDate?: string;
  Institution?: string;
  Branch?: string;
  ClientFullName?: string;
  ParentContract?: string;
  TopContract?: string;
}

export interface AdminContractItem {
  id: number;
  contractNumber: string;
  contractName: string;
  type: ContractType;
  productCode: string;
  clientNumber: string;
  userEmail: string;
  userIsActive: boolean;
  createdAt: Date;
}

@Injectable()
export class ContractService {
  private readonly treeCache = new Map<
    string,
    { data: ContractTreeLiability[]; expiresAt: number }
  >();
  private readonly TREE_CACHE_TTL_MS = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientService,
    private readonly cardService: CardService,
    private readonly way4Service: ContractWay4Service,
    private readonly treeService: ContractTreeService,
  ) {}

  // ---------------------------------------------------------
  // CACHE & CÂY HỢP ĐỒNG (Gọi qua TreeService)
  // ---------------------------------------------------------
  public invalidateTreeCache(clientNumber: string): void {
    this.treeCache.delete(clientNumber);
  }

  private async getContractTreeCachedByClientNumber(
    clientNumber: string,
  ): Promise<ContractTreeLiability[]> {
    const cached = this.treeCache.get(clientNumber);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const records =
      await this.way4Service.getContractsByClientNumber(clientNumber);
    const tree = this.treeService.buildContractTree(records);

    this.treeCache.set(clientNumber, {
      data: tree,
      expiresAt: Date.now() + this.TREE_CACHE_TTL_MS,
    });
    return tree;
  }

  async listAllContracts(
    query: GetAdminContractsQueryDto & {
      contractNumber?: string;
      contractName?: string;
      productCode?: string;
      userEmail?: string;
      userIsActive?: string; // Khai báo thêm ở đây
    },
  ): Promise<PaginatedResult<AdminContractItem>> {
    const where = buildContractWhere(query);
    const orderBy = buildContractOrderBy(
      query.sortBy,
      query.sortOrder ?? 'desc',
    );
    const skip = (query.page - 1) * query.pageSize;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { user: { select: { email: true, isActive: true } } },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const data: AdminContractItem[] = contracts.map((c) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      contractName: c.contractName ?? '',
      type: c.type,
      productCode: c.productCode ?? '',
      clientNumber: c.clientNumber,
      userEmail: c.user?.email ?? '',
      userIsActive: c.user?.isActive ?? false,
      createdAt: c.createdAt,
    }));

    return { data, meta: buildMeta(query.page, query.pageSize, total) };
  }

  async getContractTreeByClientNumber(
    clientNumber: string,
  ): Promise<ContractTreeLiability[]> {
    const records =
      await this.way4Service.getContractsByClientNumber(clientNumber);
    return this.treeService.buildContractTree(records);
  }

  async getMyContractTreePaginated(
    clientId: string,
    userId: number,
    query: GetContractTreeQueryDto,
  ): Promise<PaginatedResult<ContractTreeLiability>> {
    const clientResult = await this.clientService.getByParams(clientId);
    const clientNumber = clientResult.IssClientDetailsV2APIRecord?.ClientNumber;
    if (!clientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được ClientNumber từ hồ sơ khách hàng',
      );
    }

    const fullTree = await this.getContractTreeCachedByClientNumber(
      String(clientNumber),
    );

    const [contractRows, cardRows] = await Promise.all([
      this.prisma.contract.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { contractNumber: true },
      }),
      this.prisma.card.findMany({
        where: { issuingContract: { userId } },
        orderBy: { createdAt: 'desc' },
        include: { issuingContract: true },
      }),
    ]);

    const contractRank = this.treeService.buildRecencyRank(
      contractRows.map((r) => ({ key: r.contractNumber })),
    );
    const cardRank = this.treeService.buildRecencyRank(
      cardRows.map((c) => ({ key: c.cardNumber })),
    );

    const sortedTree = this.treeService
      .sortByRecency(fullTree, contractRank)
      .map((liab) => ({
        ...liab,
        issuings: this.treeService
          .sortByRecency(liab.issuings, contractRank)
          .map((iss) => ({
            ...iss,
            cards: this.treeService.sortByRecency(iss.cards, cardRank),
          })),
      }));

    const filtered = this.treeService.filterContractTree(sortedTree, query);

    const { page, pageSize } = query;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      meta: { page, pageSize, total, totalPages },
    };
  }

  // ---------------------------------------------------------
  // CHI TIẾT HỢP ĐỒNG
  // ---------------------------------------------------------
  private async assertContractAccessible(
    contractNumber: string,
    userId: number,
  ): Promise<void> {
    const ownContract = await this.prisma.contract.findFirst({
      where: { userId, contractNumber },
    });
    if (ownContract) return;

    const ownCard = await this.prisma.card.findFirst({
      where: { cardNumber: contractNumber, issuingContract: { userId } },
    });
    if (ownCard) return;

    throw new NotFoundException('Không tìm thấy hợp đồng này thuộc về bạn.');
  }

  async getContract(
    contractNumber: string,
    userId: number,
  ): Promise<GetContractDetailDto> {
    await this.assertContractAccessible(contractNumber, userId);

    // Gọi API qua Way4Service
    const raw = await this.way4Service.getContractDetailRaw(contractNumber);
    const envelope = asRecord(raw) ?? {};
    const record = (asRecord(envelope.IssContractDetailsAPIOutputV2Record) ??
      envelope) as Way4ContractDetailRecord;

    if (!record.ContractNumber) {
      throw new NotFoundException('Không tìm thấy hợp đồng trên WAY4.');
    }

    return {
      contractNumber: String(record.ContractNumber),
      contractName: String(record.ContractName ?? ''),
      status: splitWay4Field(record.Status).label,
      statusCode: record.StatusCode
        ? splitWay4Field(record.StatusCode).code
        : undefined,
      productCode: record.ProductCode,
      productName: record.Product
        ? splitWay4Field(record.Product).label
        : undefined,
      currency: record.Currency
        ? splitWay4Field(record.Currency).label
        : undefined,
      creditLimit: toNumberOrUndefined(record.CreditLimit),
      available: toNumberOrUndefined(record.Available),
      balance: toNumberOrUndefined(record.Balance),
      totalDue: toNumberOrUndefined(record.TotalDue),
      pastDue: toNumberOrUndefined(record.PastDue),
      pastDueDays: toNumberOrUndefined(record.PastDueDays),
      openDate: record.OpenDate,
      lastBillingDate: record.LastBillingDate,
      nextBillingDate: record.NextBillingDate,
      institution: record.Institution
        ? splitWay4Field(record.Institution).label
        : undefined,
      branch: record.Branch ? splitWay4Field(record.Branch).label : undefined,
      clientFullName: record.ClientFullName,
      parentContract: record.ParentContract
        ? splitWay4Field(record.ParentContract).label
        : undefined,
      topContract: record.TopContract
        ? splitWay4Field(record.TopContract).label
        : undefined,
    };
  }
}
