// card.template.ts
import { escapeXml, buildSoapEnvelope } from '../common/utils/xml.util';
import { EditCardDto } from './dto/edit-card.dto';
import { toEmbossingSafeName } from '../common/utils/text.utils';

export interface BuildCreateCardXmlParams {
  issuingContractNumber: string;
  productCode: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName?: string;
  cbsNumber?: string;
}

export interface BuildCreateSupplementaryCardXmlParams {
  clientNumber: string;
  mainContractNumber: string;
  productCode: string;
  cardName: string;
  embossedFirstName: string;
  embossedLastName: string;
}

export function buildEditCardXml(
  contractNumber: string,
  dto: EditCardDto,
  officer: string,
): string {
  const bodyContent = `
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
        <wsin:EmbossedFirstName>${escapeXml(toEmbossingSafeName(dto.embossedFirstName))}</wsin:EmbossedFirstName>
        <wsin:EmbossedLastName>${escapeXml(toEmbossingSafeName(dto.embossedLastName))}</wsin:EmbossedLastName>
        <wsin:EmbossedCompanyName>${escapeXml(toEmbossingSafeName(dto.embossedCompanyName))}</wsin:EmbossedCompanyName>
        <wsin:AddInfo01/>
        <wsin:AddInfo02/>
        <wsin:AddInfo03/>
        <wsin:AddInfo04/>
      </wsin:InObject>
    </wsin:EditCardV2>
  `;
  return buildSoapEnvelope(bodyContent, officer);
}

export function buildCreateCardXml(
  params: BuildCreateCardXmlParams,
  officer: string,
): string {
  const safeFirstName = toEmbossingSafeName(params.embossedFirstName);
  const safeLastName = toEmbossingSafeName(params.embossedLastName);
  const safeCompanyName = params.embossedCompanyName
    ? toEmbossingSafeName(params.embossedCompanyName)
    : '';

  const bodyContent = `
    <wsin:CreateCardV3>
      <wsin:ContractSearchMethod>CONTRACT_NUMBER</wsin:ContractSearchMethod>
      <wsin:ContractIdentifier>${escapeXml(params.issuingContractNumber)}</wsin:ContractIdentifier>
      <wsin:ProductCode>${escapeXml(params.productCode)}</wsin:ProductCode>
      <wsin:ProductCode2/>
      <wsin:ProductCode3/>
      <wsin:InObject>
        <wsin:CardName>${escapeXml(params.cardName)}</wsin:CardName>
        <wsin:CBSNumber>${escapeXml(params.cbsNumber ?? '')}</wsin:CBSNumber>
        <wsin:EmbossedFirstName>${escapeXml(safeFirstName)}</wsin:EmbossedFirstName>
        <wsin:EmbossedLastName>${escapeXml(safeLastName)}</wsin:EmbossedLastName>
        <wsin:EmbossedCompanyName>${escapeXml(safeCompanyName)}</wsin:EmbossedCompanyName>
      </wsin:InObject>
    </wsin:CreateCardV3>
  `;
  return buildSoapEnvelope(bodyContent, officer);
}

export function buildCreateSupplementaryCardXml(
  params: BuildCreateSupplementaryCardXmlParams,
  officer: string,
): string {
  const bodyContent = `
    <wsin:CreateSupplementaryCardV2>
      <wsin:ClientSearchMethod>CLIENT_NUMBER</wsin:ClientSearchMethod>
      <wsin:ClientIdentifier>${escapeXml(params.clientNumber)}</wsin:ClientIdentifier>
      <wsin:ContractSearchMethod>CONTRACT_NUMBER</wsin:ContractSearchMethod>
      <wsin:ContractIdentifier>${escapeXml(params.mainContractNumber)}</wsin:ContractIdentifier>
      <wsin:ProductCode>${escapeXml(params.productCode)}</wsin:ProductCode>
      <wsin:InObject>
        <wsin:CardName>${escapeXml(params.cardName)}</wsin:CardName>
        <wsin:EmbossedFirstName>${escapeXml(params.embossedFirstName)}</wsin:EmbossedFirstName>
        <wsin:EmbossedLastName>${escapeXml(params.embossedLastName)}</wsin:EmbossedLastName>
      </wsin:InObject>
    </wsin:CreateSupplementaryCardV2>
  `;
  return buildSoapEnvelope(bodyContent, officer);
}
