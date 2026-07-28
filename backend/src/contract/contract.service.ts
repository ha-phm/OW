import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import { ClientService } from '../client/client.service';
import { CardService, CardContractResponse } from '../card/card.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateIssuingContractDto } from './dto/create-issuing-contract.dto';
import { CreateFullCardDto } from './dto/create-full-card.dto';
import { CreateCardDto } from '../card/dto/create-card.dto';
import {
  buildCreateContractXml,
  buildCreateIssuingContractXml,
} from './contract.templates';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// --- INTERFACES ---
export interface CreateContractResult {
  CreatedContract?: string;
  ContractNumber?: string;
  ApplicationNumber?: string;
  CreatedCard?: string;
  CardNumber?: string;
  ExpiryDate?: string;
  SequenceNumber?: string;
}

export interface ContractResponse {
  success: boolean;
  contractNumber?: string;
  applicationNumber?: string;
}

export interface FullCardApplicationResponse {
  success: boolean;
  message: string;
  liabilityContract?: string;
  issuingContract?: string;
  cardPan: string;
  expiryDate: string;
}

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
    private readonly clientService: ClientService,
    private readonly prisma: PrismaService,
    private readonly cardService: CardService, // thêm dependency này
  ) {}

  // --- HELPER: Parse dữ liệu an toàn từ Way4 ---
  private extractWay4Data(
    result: any,
    methodName: string,
  ): CreateContractResult {
    const data = result?.[`${methodName}Result`] || result;

    if (!data || (!data.ContractNumber && !data.CardNumber)) {
      this.logger.error(`Lỗi parse kết quả Way4 cho ${methodName}`, result);
      throw new InternalServerErrorException(
        `Không lấy được định danh hợp đồng/thẻ từ WAY4 cho method ${methodName}`,
      );
    }
    return data as CreateContractResult;
  }

  // --- HELPER: Ép về string an toàn (WAY4/SOAP đôi khi trả về number) ---
  private toStringOrUndefined(value: unknown): string | undefined {
    return value !== null && value !== undefined ? String(value) : undefined;
  }

  private toStringOrNull(value: unknown): string | null {
    return value !== null && value !== undefined ? String(value) : null;
  }

  // --- QUERY METHODS ---
  async getContractsByClientId(clientId: string): Promise<unknown[]> {
    const clientResult = await this.clientService.getByParams(clientId);

    const clientNumber = (clientResult as any)?.IssClientDetailsV2APIRecord
      ?.ClientNumber;

    if (!clientNumber) {
      throw new InternalServerErrorException(
        'Không lấy được ClientNumber từ hồ sơ khách hàng',
      );
    }

    return this.getContractsByClientNumber(String(clientNumber));
  }

  async getContractsByClientNumber(clientNumber: string): Promise<unknown[]> {
    const result = await this.soap.call<{
      IssContractDetailsAPIOutputV2Record?: unknown | unknown[];
    }>('GetContractsByClientV2', {
      ClientSearchMethod: 'CLIENT_NUMBER',
      ClientIdentifier: clientNumber,
    });

    const records = result?.IssContractDetailsAPIOutputV2Record;
    if (!records) return [];
    return Array.isArray(records) ? records : [records];
  }

  getContract(contractNumber: string): Promise<unknown> {
    return this.soap.call('GetContractV2', {
      ContractSearchMethod: 'CONTRACT_NUMBER',
      ContractIdentifier: contractNumber,
    });
  }

  // --- CREATE METHODS ---
  async createContract(dto: CreateContractDto): Promise<ContractResponse> {
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

  async createIssuingContract(
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

  // Đã xóa hàm createCardContract() ở đây — logic này giờ nằm ở
  // CardService.createCardContract(), tránh trùng lặp và tránh gọi
  // trực tiếp buildCreateCardXml (vốn không được import trong file này).

  // --- ORCHESTRATION: Tạo luồng chuẩn 3 bước ---
  async createFullCardApplication(
    dto: CreateFullCardDto,
  ): Promise<FullCardApplicationResponse> {
    const user = await this.prisma.user.findFirst({
      where: { clientNumber: dto.clientNumber },
    });

    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy User ứng với clientNumber ${dto.clientNumber}.`,
      );
    }

    // Bước 1: Tạo Liability Contract (WAY4)
    const liabDto: CreateContractDto = {
      clientNumber: dto.clientNumber,
      productCode: dto.liabProductCode,
      contractName: 'Liability Contract',
      cbsNumber: dto.cbsNumber,
      institutionCode: dto.institutionCode,
      branch: dto.branch,
      reason: 'Auto created via full-card application',
    };

    this.logger.log(
      `Đang tạo Liability Contract cho KH ${dto.clientNumber}...`,
    );
    const liabResult = await this.createContract(liabDto);
    this.logger.log(`✅ Liability OK: ${liabResult.contractNumber}`);

    // Lưu Liability Contract vào Postgres
    const liabRecord = await this.prisma.contract.create({
      data: {
        userId: user.id,
        clientNumber: dto.clientNumber,
        contractNumber: liabResult.contractNumber!,
        applicationNumber: this.toStringOrNull(liabResult.applicationNumber),
        type: 'LIABILITY',
        productCode: dto.liabProductCode,
        contractName: 'Liability Contract',
      },
    });

    // Bước 2: Tạo Issuing Contract (WAY4)
    const issuingDto: CreateIssuingContractDto = {
      liabContractNumber: liabResult.contractNumber!,
      clientNumber: dto.clientNumber,
      productCode: dto.issuingProductCode,
      contractName: dto.contractName,
      cbsNumber: dto.cbsNumber,
      institutionCode: dto.institutionCode,
      branch: dto.branch,
      paymentOption: dto.paymentOption,
      bank: dto.bank,
      account: dto.account,
      bankCode: dto.bankCode,
      accName: dto.accName,
    };

    this.logger.log(
      `Đang tạo Issuing Contract liên kết với Liability: ${liabResult.contractNumber}...`,
    );
    const issuingResult = await this.createIssuingContract(issuingDto);
    this.logger.log(`✅ Issuing OK: ${issuingResult.contractNumber}`);

    // Lưu Issuing Contract vào Postgres, trỏ về Liability vừa tạo
    const issuingRecord = await this.prisma.contract.create({
      data: {
        userId: user.id,
        clientNumber: dto.clientNumber,
        contractNumber: issuingResult.contractNumber!,
        applicationNumber: this.toStringOrNull(
          issuingResult.applicationNumber,
        ),
        type: 'ISSUING',
        productCode: dto.issuingProductCode,
        contractName: dto.contractName,
        parentContractId: liabRecord.id,
      },
    });

    // Bước 3: Sinh số thẻ (WAY4)
    const cardDto: CreateCardDto = {
      issuingContractNumber: issuingResult.contractNumber!,
      productCode: dto.cardProductCode,
      embossedFirstName: dto.embossedFirstName,
      embossedLastName: dto.embossedLastName,
      embossedCompanyName: dto.embossedCompanyName,
    };

    this.logger.log(
      `Đang sinh số thẻ cho Issuing Contract: ${issuingResult.contractNumber}...`,
    );
    const cardResult: CardContractResponse =
      await this.cardService.createCardContract(cardDto);
    this.logger.log(`✅ Card OK: ${cardResult.cardNumber}`);

    // Lưu Card vào Postgres, trỏ về Issuing Contract vừa tạo
    await this.prisma.card.create({
      data: {
        issuingContractId: issuingRecord.id,
        cardNumber: String(cardResult.cardNumber),
        expiryDate: this.toStringOrNull(cardResult.expiryDate),
        sequenceNumber: this.toStringOrNull(cardResult.sequenceNumber),
        embossedFirstName: dto.embossedFirstName,
        embossedLastName: dto.embossedLastName,
      },
    });

    return {
      success: true,
      message: 'Card application completed successfully',
      liabilityContract: liabResult.contractNumber,
      issuingContract: issuingResult.contractNumber,
      cardPan: cardResult.cardNumber,
      expiryDate: cardResult.expiryDate,
    };
  }
}
