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

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

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

// Record chi tiết đầy đủ trả về bởi GetContractV2 (IssContractDetailsAPIOutputV2Record).
// Chỉ khai những field mình dùng tới, phần còn lại WAY4 có thể trả thêm nhưng bỏ qua.
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

  // ---------------------------------------------------------------------
  // Cache cây hợp đồng theo clientNumber, dùng cho GET /contracts/me (phân
  // trang + tìm kiếm). Mục đích: tránh gọi lại SOAP WAY4 mỗi lần user đổi
  // trang hoặc gõ tìm kiếm. TTL ngắn (30s) vì hạn mức/dư nợ có thể thay đổi
  // liên tục phía WAY4.
  //
  // LƯU Ý KHI SCALE: Map trong bộ nhớ chỉ đúng khi service chạy 1 instance.
  // Nếu deploy nhiều instance sau load balancer, phải thay bằng cache dùng
  // chung (Redis qua @nestjs/cache-manager) để tránh mỗi instance thấy dữ
  // liệu khác nhau.
  // ---------------------------------------------------------------------
  private readonly treeCache = new Map<
    string,
    { data: ContractTreeLiability[]; expiresAt: number }
  >();
  private readonly TREE_CACHE_TTL_MS = 30_000;

  private toStringOrUndefined(value: unknown): string | undefined {
    return value !== null && value !== undefined ? String(value) : undefined;
  }

  private toStringOrNull(value: unknown): string | null {
    return value !== null && value !== undefined ? String(value) : null;
  }

  private toNumberOrUndefined(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  private extractWay4Data(
    result: any,
    methodName: string,
  ): CreateContractResult {
    const data = result?.[`${methodName}Result`] || result;
    if (!data || !data.ContractNumber) {
      this.logger.error(`Lỗi parse kết quả WAY4 cho ${methodName}`, data);
      throw new InternalServerErrorException(
        `Không lấy được số hợp đồng từ WAY4 cho method ${methodName}`,
      );
    }
    return data as CreateContractResult;
  }

  async getContractsByClientId(
    clientId: string,
  ): Promise<Way4ContractRecord[]> {
    const clientResult = await this.clientService.getByParams(clientId);
    const clientNumber =
      clientResult?.IssClientDetailsV2APIRecord?.ClientNumber;
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

  /**
   * Kiểm tra contractNumber có thuộc về userId hiện tại không, trước khi cho
   * phép gọi WAY4 lấy chi tiết. Bắt buộc phải xử lý 2 trường hợp:
   *  - contractNumber là Liability/Issuing -> nằm trong bảng `contract`.
   *  - contractNumber là số PAN của thẻ -> nằm trong bảng `card`, liên kết
   *    ngược tới `contract` (issuing) qua issuingContractId.
   *
   * LƯU Ý: mình đoán tên quan hệ ngược trên model Card là `issuingContract`
   * (khớp với field `issuingContractId` bạn dùng ở addCardUnderIssuing, và
   * quan hệ thuận `cards` trên Contract mà bạn đã include ở addCardUnderIssuing).
   * Nếu trong schema.prisma bạn đặt tên khác, đổi lại tên field trong
   * where.issuingContract cho khớp.
   */
  private async assertContractAccessible(
    contractNumber: string,
    userId: number,
  ): Promise<void> {
    const ownContract = await this.prisma.contract.findFirst({
      where: { userId, contractNumber },
    });
    if (ownContract) return;

    const ownCard = await this.prisma.card.findFirst({
      where: {
        cardNumber: contractNumber,
        issuingContract: { userId },
      },
    });
    if (ownCard) return;

    throw new NotFoundException('Không tìm thấy hợp đồng này thuộc về bạn.');
  }

  private mapWay4RecordToDetail(raw: any): GetContractDetailDto {
    // soap.call() ở các method khác (vd GetContractsByClientV2) trả thẳng nội
    // dung đã unwrap tới field IssContractDetailsAPIOutputV2Record, nên xử lý
    // phòng cả 2 trường hợp: raw đã là record, hoặc raw còn bọc thêm 1 lớp.
    const record: Way4ContractDetailRecord =
      raw?.IssContractDetailsAPIOutputV2Record ?? raw;

    if (!record || !record.ContractNumber) {
      throw new NotFoundException('Không tìm thấy hợp đồng trên WAY4.');
    }

    return {
      contractNumber: String(record.ContractNumber),
      contractName: String(record.ContractName ?? ''),
      status: splitWay4Field(record.Status).label,
      statusCode: record.StatusCode
        ? splitWay4Field(record.StatusCode).code
        : undefined,
      contractCategory: undefined, // GetContractV2 record không trả ContractCategory riêng lẻ như GetContractsByClientV2
      productCode: record.ProductCode,
      productName: record.Product
        ? splitWay4Field(record.Product).label
        : undefined,
      currency: record.Currency
        ? splitWay4Field(record.Currency).label
        : undefined,
      creditLimit: this.toNumberOrUndefined(record.CreditLimit),
      available: this.toNumberOrUndefined(record.Available),
      balance: this.toNumberOrUndefined(record.Balance),
      totalDue: this.toNumberOrUndefined(record.TotalDue),
      pastDue: this.toNumberOrUndefined(record.PastDue),
      pastDueDays: this.toNumberOrUndefined(record.PastDueDays),
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
    type FlatNode = {
      contractNumber: string;
      contractName: string;
      category: string;
      parentContractNumber: string | null;
      status: string;
      productCode: string;
      creditLimit: number;
      balance: number;
      openDate: string;
    };

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

  // ---------------------------------------------------------------------
  // Cache + filter + pagination cho GET /contracts/me
  // ---------------------------------------------------------------------

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

  /** Gọi ngay sau khi tạo/sửa Liability, Issuing, hoặc Card thành công. */
  private invalidateTreeCache(clientNumber: string): void {
    this.treeCache.delete(clientNumber);
  }

  private filterContractTree(
    tree: ContractTreeLiability[],
    search?: string,
  ): ContractTreeLiability[] {
    const q = search?.trim().toLowerCase();
    if (!q) return tree;

    const matches = (s?: string) => (s ?? '').toLowerCase().includes(q);

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

  async getMyContractTreePaginated(
    clientId: string,
    query: GetContractTreeQueryDto,
  ): Promise<PaginatedResult<ContractTreeLiability>> {
    const clientResult = await this.clientService.getByParams(clientId);
    const clientNumber =
      clientResult?.IssClientDetailsV2APIRecord?.ClientNumber;
    if (!clientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được ClientNumber từ hồ sơ khách hàng',
      );
    }

    const fullTree = await this.getContractTreeCachedByClientNumber(
      String(clientNumber),
    );
    const filtered = this.filterContractTree(fullTree, query.search);

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
      contractNumber: this.toStringOrUndefined(result.ContractNumber),
      applicationNumber: this.toStringOrUndefined(result.ApplicationNumber),
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
      contractNumber: this.toStringOrUndefined(result.ContractNumber),
      applicationNumber: this.toStringOrUndefined(result.ApplicationNumber),
    };
  }

  async createLiabilityForUserByClientId(
    userId: number,
    clientId: string,
    dto: CreateLiabilityDto,
  ): Promise<ContractResponse> {
    const clientResult = await this.clientService.getByParams(clientId);
    const clientNumber =
      clientResult?.IssClientDetailsV2APIRecord?.ClientNumber;
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
    // Đã bỏ giới hạn "mỗi user tối đa 1 Liability": 1 user giờ có thể mở nhiều
    // nhánh Liability -> Issuing -> Card độc lập với nhau. Mỗi Liability vẫn
    // chỉ có đúng 1 Issuing (xem check existingIssuing trong
    // addIssuingUnderLiability bên dưới — KHÔNG đổi), và mỗi Issuing vẫn tối
    // đa MAX_CARDS_PER_ISSUING thẻ như cũ.
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
        applicationNumber: this.toStringOrNull(result.applicationNumber),
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
        applicationNumber: this.toStringOrNull(result.applicationNumber),
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
        expiryDate: this.toStringOrNull(cardResult.expiryDate),
        sequenceNumber: this.toStringOrNull(cardResult.sequenceNumber),
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
