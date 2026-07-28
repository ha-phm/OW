import { CreateCardDto } from './dto/create-card.dto';

export const buildCreateCardXml = (
  dto: CreateCardDto,
  officer: string,
): string => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:CreateCardV3>
      <wsin:IssuingContractIdentifier>${dto.issuingContractNumber}</wsin:IssuingContractIdentifier>
      <wsin:ProductCode>${dto.productCode}</wsin:ProductCode>
      <wsin:CardName>${dto.cardName}</wsin:CardName>
      <wsin:EmbossedFirstName>${dto.embossedFirstName}</wsin:EmbossedFirstName>
      <wsin:EmbossedLastName>${dto.embossedLastName}</wsin:EmbossedLastName>
      ${dto.embossedCompanyName ? `<wsin:EmbossedCompanyName>${dto.embossedCompanyName}</wsin:EmbossedCompanyName>` : ''}
    </wsin:CreateCardV3>
  </soapenv:Body>
</soapenv:Envelope>
`;

export const buildActivateCardXml = (
  contractNumber: string,
  reason: string,
  officer: string,
): string => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:ActivateCard>
      <wsin:ContractSearchMethod>CONTRACT_NUMBER</wsin:ContractSearchMethod>
      <wsin:ContractIdentifier>${contractNumber}</wsin:ContractIdentifier>
      <wsin:Reason>${reason}</wsin:Reason>
    </wsin:ActivateCard>
  </soapenv:Body>
</soapenv:Envelope>
`;
