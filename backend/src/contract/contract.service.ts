import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientService } from '../client/client.service';
import { CardService, CardContractResponse } from '../card/card.service';
import { ContractWay4Service, ContractResponse } from './contract-way4.service';
import {
  ContractTreeService,
  ContractTreeLiability,
} from './contract-tree.service';
import { QuickOpenCardDto } from './dto/quick-open-card.dto';
import { GetContractDetailDto } from './interfaces/contract-detail.interface';
import { GetContractTreeQueryDto } from './dto/get-contract-tree-query.dto';
import {
  CARD_CATEGORY_PRODUCT_CODE,
  CARD_CATEGORY_LABEL,
  splitWay4Field,
} from './contract.constants';
import {
  asRecord,
  toNumberOrUndefined,
  toStringOrNull,
} from '../common/utils/way4-response.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

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
@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
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
  private invalidateTreeCache(clientNumber: string): void {
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

  // ---------------------------------------------------------
  // LUỒNG TẠO THẺ NHANH (Mảnh ghép chính)
  // ---------------------------------------------------------
  private async createLiabilityForUser(
    userId: number,
    clientNumber: string,
    dto: QuickOpenCardDto,
  ): Promise<ContractResponse> {
    const result = await this.way4Service.callCreateContract({
      clientNumber,
      productCode: 'LIAB_TRAINING01',
      contractName: 'Liability Contract',
      cbsNumber: dto.cbsNumber,
      institutionCode: dto.institutionCode,
      branch: dto.branch,
      reason: 'Mo ho so han muc',
    });

    await this.prisma.contract.create({
      data: {
        userId,
        clientNumber,
        contractNumber: result.contractNumber!,
        applicationNumber: toStringOrNull(result.applicationNumber),
        type: 'LIABILITY',
        productCode: 'LIAB_TRAINING01',
        contractName: 'Liability Contract',
      },
    });

    this.invalidateTreeCache(clientNumber);
    return result;
  }

  private async addIssuingUnderLiability(
    userId: number,
    liabilityContractNumber: string,
    dto: QuickOpenCardDto,
  ): Promise<ContractResponse> {
    const liability = await this.prisma.contract.findFirst({
      where: {
        userId,
        type: 'LIABILITY',
        contractNumber: liabilityContractNumber,
      },
    });
    if (!liability) {
      throw new NotFoundException('Không tìm thấy hợp đồng hạn mức này.');
    }

    const existingIssuing = await this.prisma.contract.findFirst({
      where: { parentContractId: liability.id, type: 'ISSUING' },
    });
    if (existingIssuing) {
      throw new BadRequestException('Đã có hợp đồng phát hành.');
    }

    const result = await this.way4Service.callCreateIssuingContract({
      liabContractNumber: liability.contractNumber,
      clientNumber: liability.clientNumber,
      productCode: 'ISSUING_TRAINING01',
      contractName: 'Issuing Contract',
      cbsNumber: dto.cbsNumber,
      institutionCode: dto.institutionCode,
      branch: dto.branch,
      paymentOption: dto.paymentOption,
      bank: dto.bank,
      account: dto.account,
      bankCode: dto.bankCode,
      accName: dto.accName,
    });

    await this.prisma.contract.create({
      data: {
        userId,
        clientNumber: liability.clientNumber,
        contractNumber: result.contractNumber!,
        applicationNumber: toStringOrNull(result.applicationNumber),
        type: 'ISSUING',
        productCode: 'ISSUING_TRAINING01',
        contractName: 'Issuing Contract',
        parentContractId: liability.id,
      },
    });

    this.invalidateTreeCache(liability.clientNumber);
    return result;
  }

  private async addCardUnderIssuing(
    userId: number,
    issuingContractNumber: string,
    dto: QuickOpenCardDto,
  ): Promise<CardApplicationResponse> {
    const issuing = await this.prisma.contract.findFirst({
      where: {
        userId,
        type: 'ISSUING',
        contractNumber: issuingContractNumber,
      },
      include: { cards: true, parentContract: true },
    });
    if (!issuing) {
      throw new NotFoundException('Không tìm thấy hợp đồng phát hành này.');
    }

    const productCode = CARD_CATEGORY_PRODUCT_CODE[dto.cardCategory];
    //if (issuing.cards.some((c) => c.productCode === productCode)) {
    // throw new BadRequestException(`Bạn đã mở loại thẻ này rồi.`);
    //}
    //if (issuing.cards.length >= MAX_CARDS_PER_ISSUING) {
    //  throw new BadRequestException(`Đã đạt giới hạn tối đa thẻ.`);
    //}

    const cardResult: CardContractResponse =
      await this.cardService.createCardContract({
        issuingContractNumber: issuing.contractNumber,
        productCode,
        embossedFirstName: dto.embossedFirstName,
        embossedLastName: dto.embossedLastName,
        embossedCompanyName: dto.embossedCompanyName,
      });

    await this.prisma.card.create({
      data: {
        issuingContractId: issuing.id,
        cardNumber: String(cardResult.cardNumber),
        expiryDate: toStringOrNull(cardResult.expiryDate),
        sequenceNumber: toStringOrNull(cardResult.sequenceNumber),
        embossedFirstName: dto.embossedFirstName,
        embossedLastName: dto.embossedLastName,
        productCode,
        cardName: dto.cardName,
      },
    });

    this.invalidateTreeCache(issuing.clientNumber);

    return {
      success: true,
      message: `Mở thẻ "${CARD_CATEGORY_LABEL[dto.cardCategory]}" thành công`,
      liabContract: issuing.parentContract?.contractNumber,
      issuingContract: issuing.contractNumber,
      cardPan: cardResult.cardNumber,
      expiryDate: cardResult.expiryDate,
    };
  }

  async quickOpenCard(
    userId: number,
    clientId: string,
    dto: QuickOpenCardDto,
  ): Promise<CardApplicationResponse> {
    const clientResult = await this.clientService.getByParams(clientId);
    const profile = clientResult.IssClientDetailsV2APIRecord;
    if (!profile?.ClientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được hồ sơ khách hàng.',
      );
    }

    const clientNumber = String(profile.ClientNumber);

    let liability = await this.prisma.contract.findFirst({
      where: { userId, type: 'LIABILITY' },
    });
    if (!liability) {
      await this.createLiabilityForUser(userId, clientNumber, dto);
      liability = await this.prisma.contract.findFirst({
        where: { userId, type: 'LIABILITY' },
      });
    }

    let issuing = await this.prisma.contract.findFirst({
      where: { parentContractId: liability!.id, type: 'ISSUING' },
    });
    if (!issuing) {
      await this.addIssuingUnderLiability(
        userId,
        liability!.contractNumber,
        dto,
      );
      issuing = await this.prisma.contract.findFirst({
        where: { parentContractId: liability!.id, type: 'ISSUING' },
      });
    }

    return this.addCardUnderIssuing(userId, issuing!.contractNumber, dto);
  }
}
