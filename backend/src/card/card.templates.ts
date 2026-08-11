import { EditCardDto } from './dto/edit-card.dto';

function escapeXml(value?: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface BuildCreateCardXmlParams {
  issuingContractNumber: string;
  productCode: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  cbsNumber?: string;
}

export function buildCreateCardXml(params: BuildCreateCardXmlParams, officer: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:CreateCardV3>
      <wsin:ContractSearchMethod>CONTRACT_NUMBER</wsin:ContractSearchMethod>
      <wsin:ContractIdentifier>${escapeXml(params.issuingContractNumber)}</wsin:ContractIdentifier>
      <wsin:ProductCode>${escapeXml(params.productCode)}</wsin:ProductCode>
      <wsin:ProductCode2/>
      <wsin:ProductCode3/>
      <wsin:InObject>
        <wsin:CardName>${escapeXml(params.cardName)}</wsin:CardName>
        <wsin:CBSNumber>${escapeXml(params.cbsNumber ?? '')}</wsin:CBSNumber>
        <wsin:EmbossedFirstName>${escapeXml(params.embossedFirstName)}</wsin:EmbossedFirstName>
        <wsin:EmbossedLastName>${escapeXml(params.embossedLastName)}</wsin:EmbossedLastName>
        <wsin:EmbossedCompanyName>${escapeXml(params.embossedCompanyName ?? '')}</wsin:EmbossedCompanyName>
      </wsin:InObject>
    </wsin:CreateCardV3>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function buildEditCardXml(contractNumber: string, dto: EditCardDto, officer: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:EditCardV2>
      <wsin:ContractSearchMethod>CONTRACT_NUMBER</wsin:ContractSearchMethod>
      <wsin:ContractIdentifier>${escapeXml(contractNumber)}</wsin:ContractIdentifier>
      <wsin:Reason>Chinh sua thong tin the</wsin:Reason>
      <wsin:InObject>
        <wsin:Branch/>
        <wsin:ContractSubtypeCode/>
        <wsin:CardNumber/>
        <wsin:CardName>${escapeXml(dto.cardName)}</wsin:CardName>
        <wsin:ExpirationDate/>
        <wsin:CBSID/>
        <wsin:CBSNumber/>
        <wsin:RiskFactor/>
        <wsin:EmbossedFirstName>${escapeXml(dto.embossedFirstName)}</wsin:EmbossedFirstName>
        <wsin:EmbossedLastName>${escapeXml(dto.embossedLastName)}</wsin:EmbossedLastName>
        <wsin:EmbossedCompanyName>${escapeXml(dto.embossedCompanyName)}</wsin:EmbossedCompanyName>
        <wsin:AddInfo01/>
        <wsin:AddInfo02/>
        <wsin:AddInfo03/>
        <wsin:AddInfo04/>
      </wsin:InObject>
    </wsin:EditCardV2>
  </soapenv:Body>
</soapenv:Envelope>`;
}
