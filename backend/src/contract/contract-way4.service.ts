import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapService } from '../soap/soap.service';
import {
  buildCreateContractXml,
  buildCreateIssuingContractXml,
} from './contract.templates';
import {
  asRecord,
  toComparableString,
  toStringOrUndefined,
} from '../common/utils/way4-response.util';

// Di chuyển các DTO/Interface giao tiếp với WAY4 sang đây
export interface CreateContractDto {
  clientNumber: string;
  productCode: string;
  contractName: string;
  cbsNumber?: string;
  institutionCode?: string;
  branch?: string;
  reason?: string;
}

export interface CreateIssuingContractDto {
  liabContractNumber: string;
  liabCategory?: string;
  clientNumber: string;
  productCode: string;
  contractName: string;
  cbsNumber?: string;
  institutionCode?: string;
  branch?: string;
  paymentOption?: string;
  bank?: string;
  account?: string;
  bankCode?: string;
  accName?: string;
}

export interface Way4ContractRecord {
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

export interface ContractResponse {
  success: boolean;
  contractNumber?: string;
  applicationNumber?: string;
}

@Injectable()
export class ContractWay4Service {
  private readonly logger = new Logger(ContractWay4Service.name);

  constructor(
    private readonly soap: SoapService,
    private readonly config: ConfigService,
  ) {}

  private extractWay4Data(result: unknown, methodName: string) {
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

  async getContractDetailRaw(contractNumber: string): Promise<unknown> {
    return this.soap.call('GetContractV2', {
      ContractSearchMethod: 'CONTRACT_NUMBER',
      ContractIdentifier: contractNumber,
    });
  }

  async callCreateContract(dto: CreateContractDto): Promise<ContractResponse> {
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

  async callCreateIssuingContract(
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
}
