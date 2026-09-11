import { buildOptionalTag, escapeXml } from '../common/utils/xml.util';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

export function buildCreateClientXml(dto: CreateClientDto): string {
  // Logic xử lý tên và mã chi nhánh giữ nguyên
  const shortName =
    `${dto.lastName} ${dto.middleName ?? ''} ${dto.firstName}`.trim();
  const branchCode = dto.branch ?? '0101';

  // Chỉ trả về nội dung của Body
  return `
    <wsin:CreateClientV4>
      <wsin:Reason>Create client</wsin:Reason>
      <wsin:CreateClient_InObject>
        <wsin:InstitutionCode>0001</wsin:InstitutionCode>
        <wsin:Branch>${branchCode}</wsin:Branch>
        <wsin:ClientTypeCode>PR</wsin:ClientTypeCode>
        <wsin:ClientCategory></wsin:ClientCategory>
        <wsin:ServiceGroup></wsin:ServiceGroup>
        <wsin:ProductCategory></wsin:ProductCategory>
        <wsin:LanguageCode></wsin:LanguageCode>
        <wsin:SalutationSuffix></wsin:SalutationSuffix>
        <wsin:ShortName>${escapeXml(shortName)}</wsin:ShortName>
        <wsin:FirstName>${escapeXml(dto.firstName)}</wsin:FirstName>
        <wsin:LastName>${escapeXml(dto.lastName)}</wsin:LastName>
        <wsin:MiddleName>${escapeXml(dto.middleName ?? '')}</wsin:MiddleName>
        <wsin:MaritalStatusCode>${escapeXml(dto.maritalStatusCode)}</wsin:MaritalStatusCode>
        <wsin:SocialSecurityNumber>${escapeXml(dto.socialSecurityNumber)}</wsin:SocialSecurityNumber>
        <wsin:SalutationCode>${escapeXml(dto.salutationCode)}</wsin:SalutationCode>
        <wsin:BirthDate>${escapeXml(dto.birthDate)}</wsin:BirthDate>
        <wsin:Gender>${escapeXml(dto.gender)}</wsin:Gender>
        <wsin:BirthPlace></wsin:BirthPlace>
        <wsin:BirthName></wsin:BirthName>
        <wsin:Citizenship>VNM</wsin:Citizenship>
        <wsin:TaxBracket></wsin:TaxBracket>
        <wsin:IndividualTaxpayerNumber>${escapeXml(dto.individualTaxpayerNumber ?? '')}</wsin:IndividualTaxpayerNumber>
        <wsin:SecretPhrase></wsin:SecretPhrase>
        <wsin:CompanyName>${escapeXml(dto.companyName ?? '')}</wsin:CompanyName>
        <wsin:Trademark></wsin:Trademark>
        <wsin:Department></wsin:Department>
        <wsin:EmbossedTitleCode></wsin:EmbossedTitleCode>
        <wsin:EmbossedFirstName></wsin:EmbossedFirstName>
        <wsin:EmbossedLastName></wsin:EmbossedLastName>
        <wsin:EmbossedCompanyName></wsin:EmbossedCompanyName>
        <wsin:IdentityCardType></wsin:IdentityCardType>
        <wsin:IdentityCardNumber>${escapeXml(dto.identityCardNumber)}</wsin:IdentityCardNumber>
        <wsin:IdentityCardDetails>${escapeXml(dto.identityCardDetails ?? '')}</wsin:IdentityCardDetails>
        <wsin:ClientNumber>${dto.clientNumber ?? ''}</wsin:ClientNumber>
        <wsin:Profession>${escapeXml(dto.profession ?? '')}</wsin:Profession>
        <wsin:EMail>${escapeXml(dto.email)}</wsin:EMail>
        <wsin:AddressLine1>${escapeXml(dto.addressLine1)}</wsin:AddressLine1>
        <wsin:AddressLine2></wsin:AddressLine2>
        <wsin:AddressLine3></wsin:AddressLine3>
        <wsin:AddressLine4></wsin:AddressLine4>
        <wsin:City>${escapeXml(dto.city)}</wsin:City>
        <wsin:HomePhone>${dto.homePhone ?? ''}</wsin:HomePhone>
        <wsin:MobilePhone>${dto.mobilePhone}</wsin:MobilePhone>
        <wsin:BusinessPhone></wsin:BusinessPhone>
      </wsin:CreateClient_InObject>
      <wsin:SetCustomData_InObject>
        <wsin:AddInfoType>AddInfo01</wsin:AddInfoType>
        <wsin:TagName>PrevID_01</wsin:TagName>
        <wsin:TagValue>A1</wsin:TagValue>
      </wsin:SetCustomData_InObject>
      <wsin:SetCustomData_InObject>
        <wsin:AddInfoType>AddInfo01</wsin:AddInfoType>
        <wsin:TagName>PrevID_02</wsin:TagName>
        <wsin:TagValue>A2</wsin:TagValue>
      </wsin:SetCustomData_InObject>
    </wsin:CreateClientV4>
  `;
}

export function buildGetClientXml(
  searchMethod: string,
  identifier: string,
  // XÓA: Bỏ tham số officer
): string {
  // Chỉ trả về nội dung của Body
  return `
    <wsin:GetClientByParmsV2>
      <wsin:ClientSearchMethod>${searchMethod}</wsin:ClientSearchMethod>
      <wsin:ClientIdentifier>${escapeXml(identifier)}</wsin:ClientIdentifier>
    </wsin:GetClientByParmsV2>
  `;
}

export function buildEditClientXml(
  searchMethod: string,
  clientIdentifier: string,
  dto: UpdateClientDto,
  // XÓA: Bỏ tham số officer
): string {
  // Logic xử lý tag
  let shortNameTag = '';
  if (dto.firstName && dto.lastName) {
    const shortName =
      `${dto.lastName} ${dto.middleName ?? ''} ${dto.firstName}`.trim();
    shortNameTag = `<wsin:ShortName>${escapeXml(shortName)}</wsin:ShortName>`;
  }

  // Chỉ trả về nội dung của Body
  return `
    <wsin:EditClientV6>
      <wsin:ClientSearchMethod>${searchMethod}</wsin:ClientSearchMethod>
      <wsin:ClientIdentifier>${escapeXml(clientIdentifier)}</wsin:ClientIdentifier>
      <wsin:Reason>Update Client Information</wsin:Reason>
      <wsin:EditClient_InObject>
        ${shortNameTag}
        ${buildOptionalTag('FirstName', dto.firstName)}
        ${buildOptionalTag('MiddleName', dto.middleName)}
        ${buildOptionalTag('LastName', dto.lastName)}
        ${buildOptionalTag('BirthDate', dto.birthDate)}
        ${buildOptionalTag('Gender', dto.gender)}
        ${buildOptionalTag('MaritalStatusCode', dto.maritalStatusCode)}
        ${buildOptionalTag('SalutationCode', dto.salutationCode)}
        ${buildOptionalTag('MobilePhone', dto.mobilePhone)}
        ${buildOptionalTag('EMail', dto.email)}
        ${buildOptionalTag('IdentityCardNumber', dto.identityCardNumber)}
        ${buildOptionalTag('IdentityCardDetails', dto.identityCardDetails)}
        ${buildOptionalTag('IndividualTaxpayerNumber', dto.individualTaxpayerNumber)}
        ${buildOptionalTag('SocialSecurityNumber', dto.socialSecurityNumber)}
        ${buildOptionalTag('AddressLine1', dto.addressLine1)}
        ${buildOptionalTag('City', dto.city)}
        ${buildOptionalTag('HomePhone', dto.homePhone)}
        ${buildOptionalTag('CompanyName', dto.companyName)}
        ${buildOptionalTag('Profession', dto.profession)}
      </wsin:EditClient_InObject>
      <wsin:SetCustomData_InObject></wsin:SetCustomData_InObject>
    </wsin:EditClientV6>
  `;
}
