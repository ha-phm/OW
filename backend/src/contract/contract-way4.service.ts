import { Injectable } from '@nestjs/common';
import { SoapService } from '../soap/soap.service';
import {
  buildCreateContractXml,
  buildCreateIssuingContractXml,
} from './contract.templates';
import {
  extractWay4Result,
  toStringOrUndefined,
} from '../common/utils/way4-response.util';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateIssuingContractDto } from './dto/create-issuing-contract.dto';

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
  constructor(private readonly soap: SoapService) {}

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
    const xml = buildCreateContractXml(dto);
    const rawResult = await this.soap.sendRaw('CreateContractV4', xml);

    const data = extractWay4Result(rawResult, 'CreateContractV4');

    return {
      success: true,
      contractNumber: toStringOrUndefined(data.ContractNumber),
      applicationNumber: toStringOrUndefined(data.ApplicationNumber),
    };
  }

  async callCreateIssuingContract(
    dto: CreateIssuingContractDto,
  ): Promise<ContractResponse> {
    const xml = buildCreateIssuingContractXml(dto);
    const rawResult = await this.soap.sendRaw(
      'CreateIssuingContractWithLiabilityV2',
      xml,
    );

    const data = extractWay4Result(
      rawResult,
      'CreateIssuingContractWithLiabilityV2',
    );

    return {
      success: true,
      contractNumber: toStringOrUndefined(data.ContractNumber),
      applicationNumber: toStringOrUndefined(data.ApplicationNumber),
    };
  }
}
