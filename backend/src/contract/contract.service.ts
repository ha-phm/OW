import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { ClientService } from '../client/client.service';
import { CardService, CardContractResponse } from '../card/card.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateIssuingContractDto } from './dto/create-issuing-contract.dto';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { AddIssuingDto } from './dto/add-issuing.dto';
import { CreateCardApplicationDto } from './dto/create-card-application.dto';
import { GetContractDetailDto } from './dto/get-contract-detail.dto';
import { GetContractTreeQueryDto } from './dto/get-contract-tree-query.dto';
import {
  buildCreateContractXml,
  buildCreateIssuingContractXml,
} from './contract.templates';
import { PrismaService } from '../prisma/prisma.service';
import {
  CARD_APPLICATION_PRODUCT_CODES,
  MAX_CARDS_PER_ISSUING,
  splitWay4Field,
} from './contract.constants';
import {
  asRecord,
  toComparableString,
  toStringOrUndefined,
  toStringOrNull,
  toNumberOrUndefined,
} from '../common/utils/way4-response.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

export interface CreateContractResult {
  ContractNumber?: string;
  ApplicationNumber?: string;
}

export interface ContractResponse {
  success: boolean;
  contractNumber?: string;
  applicationNumber?: string;
}

export interface CardApplicationResponse {
  success: boolean;
  message: string;
  issuingContract?: string;
  cardPan: string;
  expiryDate: string;
}

export interface ContractTreeCard {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
}

export interface ContractTreeIssuing {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
  creditLimit: number;
  balance: number;
  cards: ContractTreeCard[];
}

export interface ContractTreeLiability {
  contractNumber: string;
  contractName: string;
  status: string;
  productCode: string;
  openDate: string;
  issuings: ContractTreeIssuing[];
}

export type { PaginatedResult };

interface Way4ContractRecord {
  ContractNumber?: string;
  ContractName?: string;
  ContractCategory?: string;
  ParentContract?: string;
  Status?: string;
  ProductCode?: string;
  CreditLimit?: string | number;
  Balance?: string | number;
  OpenDate?: string;
}

interface Way4ContractDetailRecord {
  ContractNumber?: string;
  ContractName?: string;
  ContractCategory?: string;
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

  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    private readonly clientService: ClientService,
    private readonly prisma: PrismaService,
    private readonly cardService: CardService,
  ) {}

  private readonly treeCache = new Map<
    string,
    { data: ContractTreeLiability[]; expiresAt: number }
  >();
  private readonly TREE_CACHE_TTL_MS = 30_000;

  private extractWay4Data(
    result: unknown,
    methodName: string,
  ): CreateContractResult {
    const envelope = asRecord(result) ?? {};
    const data = asRecord(envelope[`${methodName}Result`]) ?? envelope;
    const contractNumber = toComparableString(data.ContractNumber);

    if (contractNumber === undefined) {
      this.logger.error(`Lỗi parse kết quả WAY4 cho ${methodName}`, data);
      throw new InternalServerErrorException(
        `Không lấy được số hợp đồng từ WAY4 cho method ${methodName}`,
      );
    }

    return {
      ContractNumber: contractNumber,
      ApplicationNumber: toComparableString(data.ApplicationNumber),
    };
  }

  async getContractsByClientId(
    clientId: string,
  ): Promise<Way4ContractRecord[]> {
    const clientResult = await this.clientService.getByParams(clientId);
    const clientNumber = clientResult.IssClientDetailsV2APIRecord?.ClientNumber;
    if (!clientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được ClientNumber từ hồ sơ khách hàng',
      );
    }
    return this.getContractsByClientNumber(String(clientNumber));
  }

  async getContractsByClientNumber(
    clientNumber: string,
  ): Promise<Way4ContractRecord[]> {
    const result = await this.soap.call<{
      IssContractDetailsAPIOutputV2Record?:
        Way4ContractRecord | Way4ContractRecord[];
    }>('GetContractsByClientV2', {
      ClientSearchMethod: 'CLIENT_NUMBER',
      ClientIdentifier: clientNumber,
    });

    const records = result?.IssContractDetailsAPIOutputV2Record;
    if (!records) return [];
    return Array.isArray(records) ? records : [records];
  }

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

  private mapWay4RecordToDetail(raw: unknown): GetContractDetailDto {
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
      contractCategory: undefined,
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

  async getContract(
    contractNumber: string,
    userId: number,
  ): Promise<GetContractDetailDto> {
    await this.assertContractAccessible(contractNumber, userId);
    const raw = await this.soap.call('GetContractV2', {
      ContractSearchMethod: 'CONTRACT_NUMBER',
      ContractIdentifier: contractNumber,
    });
    return this.mapWay4RecordToDetail(raw);
  }

  private buildContractTree(
    records: Way4ContractRecord[],
  ): ContractTreeLiability[] {
    interface FlatNode {
      contractNumber: string;
      contractName: string;
      category: string;
      parentContractNumber: string | null;
      status: string;
      productCode: string;
      creditLimit: number;
      balance: number;
      openDate: string;
    }

    const flat: FlatNode[] = records.map((r) => ({
      contractNumber: String(r.ContractNumber ?? ''),
      contractName: String(r.ContractName ?? ''),
      category: splitWay4Field(r.ContractCategory).code,
      parentContractNumber: r.ParentContract
        ? splitWay4Field(r.ParentContract).label
        : null,
      status: splitWay4Field(r.Status).label,
      productCode: String(r.ProductCode ?? ''),
      creditLimit: Number(r.CreditLimit ?? 0),
      balance: Number(r.Balance ?? 0),
      openDate: String(r.OpenDate ?? ''),
    }));

    const liabilities = flat.filter(
      (n) => n.category === 'A' && !n.parentContractNumber,
    );
    const issuings = flat.filter(
      (n) => n.category === 'A' && n.parentContractNumber,
    );
    const cards = flat.filter((n) => n.category === 'C');

    return liabilities.map((liab) => ({
      contractNumber: liab.contractNumber,
      contractName: liab.contractName,
      status: liab.status,
      productCode: liab.productCode,
      openDate: liab.openDate,
      issuings: issuings
        .filter((iss) => iss.parentContractNumber === liab.contractNumber)
        .map((iss) => ({
          contractNumber: iss.contractNumber,
          contractName: iss.contractName,
          status: iss.status,
          productCode: iss.productCode,
          creditLimit: iss.creditLimit,
          balance: iss.balance,
          cards: cards
            .filter((c) => c.parentContractNumber === iss.contractNumber)
            .map((c) => ({
              contractNumber: c.contractNumber,
              contractName: c.contractName,
              status: c.status,
              productCode: c.productCode,
            })),
        })),
    }));
  }

  async getContractTreeByClientId(
    clientId: string,
  ): Promise<ContractTreeLiability[]> {
    const records = await this.getContractsByClientId(clientId);
    return this.buildContractTree(records);
  }

  async getContractTreeByClientNumber(
    clientNumber: string,
  ): Promise<ContractTreeLiability[]> {
    const records = await this.getContractsByClientNumber(clientNumber);
    return this.buildContractTree(records);
  }

  private async getContractTreeCachedByClientNumber(
    clientNumber: string,
  ): Promise<ContractTreeLiability[]> {
    const cached = this.treeCache.get(clientNumber);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const records = await this.getContractsByClientNumber(clientNumber);
    const tree = this.buildContractTree(records);
    this.treeCache.set(clientNumber, {
      data: tree,
      expiresAt: Date.now() + this.TREE_CACHE_TTL_MS,
    });
    return tree;
  }

  private invalidateTreeCache(clientNumber: string): void {
    this.treeCache.delete(clientNumber);
  }

  private filterContractTree(
    tree: ContractTreeLiability[],
    search?: string,
  ): ContractTreeLiability[] {
    const q = search?.trim().toLowerCase();
    if (!q) return tree;
    const matches = (s?: string): boolean =>
      (s ?? '').toLowerCase().includes(q);

    return tree.filter((liability) => {
      if (
        matches(liability.contractNumber) ||
        matches(liability.contractName)
      ) {
        return true;
      }
      return liability.issuings.some((issuing) => {
        if (matches(issuing.contractNumber) || matches(issuing.contractName)) {
          return true;
        }
        return issuing.cards.some((card) => matches(card.contractNumber));
      });
    });
  }

  private buildRecencyRank(rows: { key: string }[]): Map<string, number> {
    const rank = new Map<string, number>();
    rows.forEach((row, idx) => rank.set(row.key, idx));
    return rank;
  }

  private sortByRecency<T extends { contractNumber: string }>(
    items: T[],
    rank: Map<string, number>,
  ): T[] {
    return [...items].sort((a, b) => {
      const ra = rank.get(a.contractNumber) ?? Number.MAX_SAFE_INTEGER;
      const rb = rank.get(b.contractNumber) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
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

    const contractRank = this.buildRecencyRank(
      contractRows.map((r) => ({ key: r.contractNumber })),
    );
    const cardRank = this.buildRecencyRank(
      cardRows.map((c) => ({ key: c.cardNumber })),
    );

    const sortedTree = this.sortByRecency(fullTree, contractRank).map(
      (liab) => ({
        ...liab,
        issuings: this.sortByRecency(liab.issuings, contractRank).map(
          (iss) => ({
            ...iss,
            cards: this.sortByRecency(iss.cards, cardRank),
          }),
        ),
      }),
    );

    const filtered = this.filterContractTree(sortedTree, query.search);
    const { page, pageSize } = query;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      meta: { page, pageSize, total, totalPages },
    };
  }

  private async callCreateContract(
    dto: CreateContractDto,
  ): Promise<ContractResponse> {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildCreateContractXml(dto, officer);
    const rawResult = await this.soap.sendRaw('CreateContractV4', xml);
    const result = this.extractWay4Data(rawResult, 'CreateContractV4');

    return {
      success: true,
      contractNumber: toStringOrUndefined(result.ContractNumber),
      applicationNumber: toStringOrUndefined(result.ApplicationNumber),
    };
  }

  private async callCreateIssuingContract(
    dto: CreateIssuingContractDto,
  ): Promise<ContractResponse> {
    const officer = this.config.get<string>('OPENWAY_OFFICER') ?? '';
    const xml = buildCreateIssuingContractXml(dto, officer);
    const rawResult = await this.soap.sendRaw(
      'CreateIssuingContractWithLiabilityV2',
      xml,
    );
    const result = this.extractWay4Data(
      rawResult,
      'CreateIssuingContractWithLiabilityV2',
    );

    return {
      success: true,
      contractNumber: toStringOrUndefined(result.ContractNumber),
      applicationNumber: toStringOrUndefined(result.ApplicationNumber),
    };
  }

  async createLiabilityForUserByClientId(
    userId: number,
    clientId: string,
    dto: CreateLiabilityDto,
  ): Promise<ContractResponse> {
    const clientResult = await this.clientService.getByParams(clientId);
    const clientNumber = clientResult.IssClientDetailsV2APIRecord?.ClientNumber;
    if (!clientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được ClientNumber từ hồ sơ khách hàng',
      );
    }
    return this.createLiabilityForUser(userId, String(clientNumber), dto);
  }

  async createLiabilityForUser(
    userId: number,
    clientNumber: string,
    dto: CreateLiabilityDto,
  ): Promise<ContractResponse> {
    const result = await this.callCreateContract({
      clientNumber,
      productCode: CARD_APPLICATION_PRODUCT_CODES.LIABILITY,
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
        productCode: CARD_APPLICATION_PRODUCT_CODES.LIABILITY,
        contractName: 'Liability Contract',
      },
    });

    this.invalidateTreeCache(clientNumber);
    return result;
  }

  async addIssuingUnderLiability(
    userId: number,
    liabilityContractNumber: string,
    dto: AddIssuingDto,
  ): Promise<ContractResponse> {
    const liability = await this.prisma.contract.findFirst({
      where: {
        userId,
        type: 'LIABILITY',
        contractNumber: liabilityContractNumber,
      },
    });
    if (!liability) {
      throw new NotFoundException(
        'Không tìm thấy hợp đồng hạn mức này thuộc về bạn.',
      );
    }

    const existingIssuing = await this.prisma.contract.findFirst({
      where: { parentContractId: liability.id, type: 'ISSUING' },
    });
    if (existingIssuing) {
      throw new BadRequestException(
        'Hợp đồng hạn mức này đã có hợp đồng phát hành.',
      );
    }

    const result = await this.callCreateIssuingContract({
      liabContractNumber: liability.contractNumber,
      clientNumber: liability.clientNumber,
      productCode: CARD_APPLICATION_PRODUCT_CODES.ISSUING,
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
        productCode: CARD_APPLICATION_PRODUCT_CODES.ISSUING,
        contractName: 'Issuing Contract',
        parentContractId: liability.id,
      },
    });

    this.invalidateTreeCache(liability.clientNumber);
    return result;
  }

  async addCardUnderIssuing(
    userId: number,
    issuingContractNumber: string,
    dto: CreateCardApplicationDto,
  ): Promise<CardApplicationResponse> {
    const issuing = await this.prisma.contract.findFirst({
      where: { userId, type: 'ISSUING', contractNumber: issuingContractNumber },
      include: { cards: true },
    });
    if (!issuing) {
      throw new NotFoundException(
        'Không tìm thấy hợp đồng phát hành này thuộc về bạn.',
      );
    }

    const existingCardCount = issuing.cards.length;

    if (existingCardCount >= MAX_CARDS_PER_ISSUING) {
      throw new BadRequestException(
        `Hợp đồng này đã đạt giới hạn tối đa ${MAX_CARDS_PER_ISSUING} thẻ.`,
      );
    }

    const cardProductCode =
      CARD_APPLICATION_PRODUCT_CODES.CARDS[existingCardCount];
    const cardResult: CardContractResponse =
      await this.cardService.createCardContract({
        issuingContractNumber: issuing.contractNumber,
        productCode: cardProductCode,
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
      },
    });

    this.invalidateTreeCache(issuing.clientNumber);

    return {
      success: true,
      message: `Mở thẻ thành công (thẻ số ${existingCardCount + 1}/${MAX_CARDS_PER_ISSUING})`,
      issuingContract: issuing.contractNumber,
      cardPan: cardResult.cardNumber,
      expiryDate: cardResult.expiryDate,
    };
  }
}
