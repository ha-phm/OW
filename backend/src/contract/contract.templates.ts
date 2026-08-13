import { escapeXml } from '../common/utils/xml.util';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateIssuingContractDto } from './dto/create-issuing-contract.dto';

function buildAddInfoTags(dto: CreateIssuingContractDto): string {
  const info01: string[] = [];
  const info02: string[] = [];

  if (dto.paymentOption)
    info01.push(`PAYMENT_OPTION=${escapeXml(dto.paymentOption)}`);
  if (dto.bank) info01.push(`BANK=${escapeXml(dto.bank)}`);
  if (dto.account) info01.push(`ACCOUNT=${escapeXml(dto.account)}`);
  if (dto.bankCode) info02.push(`BANK_CODE=${escapeXml(dto.bankCode)}`);
  if (dto.accName) info02.push(`ACC_NAME=${escapeXml(dto.accName)}`);

  let tags = '';
  if (info01.length > 0) {
    tags += `\n<wsin:AddInfo01>${info01.join(';')};</wsin:AddInfo01>`;
  }
  if (info02.length > 0) {
    tags += `\n<wsin:AddInfo02>${info02.join(';')};</wsin:AddInfo02>`;
  }
  return tags;
}

export function buildCreateContractXml(
  dto: CreateContractDto,
  officer: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:CreateContractV4>
      <wsin:ClientSearchMethod>CLIENT_NUMBER</wsin:ClientSearchMethod>
      <wsin:ClientIdentifier>${escapeXml(dto.clientNumber)}</wsin:ClientIdentifier>
      <wsin:Reason>${escapeXml(dto.reason ?? 'to test')}</wsin:Reason>
      <wsin:CreateContract_InObject>
        <wsin:Branch>${escapeXml(dto.branch ?? '0101')}</wsin:Branch>
        <wsin:InstitutionCode>${escapeXml(dto.institutionCode ?? '0001')}</wsin:InstitutionCode>
        <wsin:ProductCode>${escapeXml(dto.productCode)}</wsin:ProductCode>
        <wsin:ProductCode2/>
        <wsin:ProductCode3/>
        <wsin:ContractName>${escapeXml(dto.contractName)}</wsin:ContractName>
        <wsin:CBSNumber>${escapeXml(dto.cbsNumber ?? '')}</wsin:CBSNumber>
      </wsin:CreateContract_InObject>
      <wsin:SetCustomData_InObject></wsin:SetCustomData_InObject>
    </wsin:CreateContractV4>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function buildCreateIssuingContractXml(
  dto: CreateIssuingContractDto,
  officer: string,
): string {
  const addInfoTags = buildAddInfoTags(dto);

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:CreateIssuingContractWithLiabilityV2>
      <wsin:LiabCategory>${escapeXml(dto.liabCategory ?? 'Y')}</wsin:LiabCategory>
      <wsin:LiabContractSearchMethod>CONTRACT_NUMBER</wsin:LiabContractSearchMethod>
      <wsin:LiabContractIdentifier>${escapeXml(dto.liabContractNumber)}</wsin:LiabContractIdentifier>
      <wsin:ClientSearchMethod>CLIENT_NUMBER</wsin:ClientSearchMethod>
      <wsin:ClientIdentifier>${escapeXml(dto.clientNumber)}</wsin:ClientIdentifier>
      <wsin:ProductCode>${escapeXml(dto.productCode)}</wsin:ProductCode>
      <wsin:ProductCode2/>
      <wsin:ProductCode3/>
      <wsin:InObject>
        <wsin:Branch>${escapeXml(dto.branch ?? '0101')}</wsin:Branch>
        <wsin:InstitutionCode>${escapeXml(dto.institutionCode ?? '0001')}</wsin:InstitutionCode>
        <wsin:ContractName>${escapeXml(dto.contractName)}</wsin:ContractName>
        <wsin:CBSNumber>${escapeXml(dto.cbsNumber ?? '')}</wsin:CBSNumber>${addInfoTags}
      </wsin:InObject>
    </wsin:CreateIssuingContractWithLiabilityV2>
  </soapenv:Body>
</soapenv:Envelope>`;
}
