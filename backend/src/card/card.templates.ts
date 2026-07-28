import { CreateCardDto } from './dto/create-card.dto';

export const buildCreateCardXml = (
  dto: CreateCardDto,
  officer: string,
): string => {
  // WAY4 yêu cầu CardName không được rỗng — fallback từ tên khắc nổi
  const cardName =
    dto.cardName?.trim() ||
    `${dto.embossedFirstName} ${dto.embossedLastName}`.trim();

  return `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    <wsin:CreateCardV3>
      <wsin:ContractSearchMethod>CONTRACT_NUMBER</wsin:ContractSearchMethod>
      <wsin:ContractIdentifier>${dto.issuingContractNumber}</wsin:ContractIdentifier>
      <wsin:ProductCode>${dto.productCode}</wsin:ProductCode>
      <wsin:ProductCode2/>
      <wsin:ProductCode3/>
      <wsin:InObject>
        <wsin:CardName>${cardName}</wsin:CardName>
        <wsin:CBSNumber/>
        <wsin:EmbossedFirstName>${dto.embossedFirstName}</wsin:EmbossedFirstName>
        <wsin:EmbossedLastName>${dto.embossedLastName}</wsin:EmbossedLastName>
        ${dto.embossedCompanyName ? `<wsin:EmbossedCompanyName>${dto.embossedCompanyName}</wsin:EmbossedCompanyName>` : '<wsin:EmbossedCompanyName/>'}
      </wsin:InObject>
    </wsin:CreateCardV3>
  </soapenv:Body>
</soapenv:Envelope>
`;
};

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
